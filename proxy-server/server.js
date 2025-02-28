// Importy potrzebnych modułów
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const bodyParser = require('body-parser');

// Konfiguracja proxy dla zapytań do API IdoSell
const proxyOptions = {
  target: 'https://kmxfashion.pl',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api/admin/v5'
  },
  timeout: 60000, // Zwiększamy timeout do 60 sekund
  proxyTimeout: 60000, // Timeout dla proxy
  onProxyReq: (proxyReq, req, res) => {
    try {
      // Dodajemy nagłówki potrzebne dla IdoSell API
      // Używamy nagłówka x-api-key, jeśli istnieje, i przekształcamy go na Authorization
      if (req.headers['x-api-key']) {
        proxyReq.setHeader('Authorization', `Basic ${req.headers['x-api-key']}`);
        console.log('  Ustawiono nagłówek Authorization z x-api-key');
      }
      
      // Dodajemy pozostałe nagłówki, jeśli zostały przesłane
      if (req.headers['x-requested-with']) {
        proxyReq.setHeader('X-Requested-With', req.headers['x-requested-with']);
      }
      
      if (req.headers['x-api-version']) {
        proxyReq.setHeader('X-API-VERSION', req.headers['x-api-version']);
      }
      
      if (req.headers['x-shop-id']) {
        proxyReq.setHeader('X-Shop-Id', req.headers['x-shop-id']);
      }
      
      // Sprawdzmy, czy mamy wszystkie wymagane nagłówki
      console.log('  Sprawdzanie nagłówków API:');
      console.log('    - Authorization (z x-api-key):', !!req.headers['x-api-key']);
      console.log('    - X-Requested-With:', !!req.headers['x-requested-with']);
      
      // Logujemy nagłówki, które wysyłamy do docelowego API - bezpieczna metoda
      console.log('  Proxy request headers:');
      const headers = proxyReq.getHeaders();
      // Logujemy każdy nagłówek osobno, unikając użycia Object.fromEntries
      Object.keys(headers).forEach(key => {
        console.log(`    ${key}: ${headers[key]}`);
      });
      
      // Jeśli mamy ciało żądania w JSON, upewniamy się, że jest poprawnie przekazywane
      if (req.body && Object.keys(req.body).length > 0) {
        console.log('  Przekazuję ciało żądania do API');
        
        // Dodatkowe zabezpieczenie przed nadpisywaniem danych produktów
        // Jeśli to żądanie aktualizacji priorytetów, upewniamy się, że zawiera tylko niezbędne pola
        if (req.url === '/api/products/products' && req.method === 'PUT' && req.headers['x-action-type'] === 'update-priorities-only') {
          console.log('  UWAGA: Wykryto żądanie aktualizacji priorytetów - dodatkowe sprawdzenie bezpieczeństwa');
          
          try {
            // Sprawdzamy, czy każdy produkt zawiera tylko productId i productPriorityInMenuNodes
            const products = req.body.params?.products || [];
            
            for (const product of products) {
              // Sprawdzamy, czy produkty zawierają tylko dopuszczalne pola
              const allowedFields = ['productId', 'productPriorityInMenuNodes'];
              const actualFields = Object.keys(product);
              
              const unexpectedFields = actualFields.filter(field => !allowedFields.includes(field));
              
              if (unexpectedFields.length > 0) {
                console.warn(`  !!! OSTRZEŻENIE: Produkt ${product.productId} zawiera niedozwolone pola: ${unexpectedFields.join(', ')}`);
                console.warn('  Usuwam niedozwolone pola z produktu, aby zapobiec nadpisywaniu danych');
                
                // Usuwamy wszystkie pola oprócz dozwolonych
                unexpectedFields.forEach(field => {
                  delete product[field];
                });
              }
              
              // Dodatkowo sprawdzamy strukturę productPriorityInMenuNodes
              if (product.productPriorityInMenuNodes) {
                for (const node of product.productPriorityInMenuNodes) {
                  const allowedNodeFields = ['productMenuNodeId', 'productPriority', 'shopId', 'productMenuTreeId'];
                  const actualNodeFields = Object.keys(node);
                  
                  const unexpectedNodeFields = actualNodeFields.filter(field => !allowedNodeFields.includes(field));
                  
                  if (unexpectedNodeFields.length > 0) {
                    console.warn(`  !!! OSTRZEŻENIE: Węzeł menu produktu ${product.productId} zawiera niedozwolone pola: ${unexpectedNodeFields.join(', ')}`);
                    console.warn('  Usuwam niedozwolone pola z węzła menu, aby zapobiec nadpisywaniu danych');
                    
                    // Usuwamy wszystkie pola oprócz dozwolonych
                    unexpectedNodeFields.forEach(field => {
                      delete node[field];
                    });
                  }
                }
              }
            }
            
            console.log('  Struktura danych po walidacji jest bezpieczna - tylko pola priorytetów zostaną zaktualizowane');
          } catch (e) {
            console.error('  !!! BŁĄD podczas walidacji danych produktów:', e.message);
            console.error('  Kontynuuję, ale istnieje ryzyko nieprawidłowego działania API');
          }
        }
        
        // Usuwamy poprzednie nagłówki content-length
        proxyReq.removeHeader('content-length');
        
        // Konwertujemy body na string
        const bodyData = JSON.stringify(req.body);
        
        // Logujemy dane, które wysyłamy
        console.log('  Dane wysyłane do API:', bodyData.substring(0, 1000));
        
        // Ustawiamy nowy content-length
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        
        // Zapisujemy body do żądania proxy
        proxyReq.write(bodyData);
        proxyReq.end();
      }
    } catch (e) {
      console.error('  Błąd podczas ustawiania nagłówków proxy:', e.message, e.stack);
      // Nie rzucamy wyjątku dalej, aby nie przerwać działania proxy
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    try {
      // Dodajemy nagłówki CORS do każdej odpowiedzi
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-KEY, X-API-VERSION, X-Shop-Id, Accept, x-requested-with, x-api-key, x-api-version, x-shop-id, X-Action-Type, x-action-type');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // Szczególne traktowanie endpointu /api/products/products
      if (req.url === '/api/products/products' && proxyRes.statusCode === 200) {
        console.log('  Pomyślnie zaktualizowano priorytety produktów');
      }
      
      // Logujemy szczegóły odpowiedzi
      console.log('  Proxy response status:', proxyRes.statusCode);
      
      // Bezpieczne logowanie nagłówków
      console.log('  Proxy response headers from API:');
      Object.keys(proxyRes.headers).forEach(key => {
        console.log(`    ${key}: ${proxyRes.headers[key]}`);
      });
      
      // Jeśli status jest 401 lub 403, oznacza to problemy z autoryzacją
      if (proxyRes.statusCode === 401 || proxyRes.statusCode === 403) {
        console.error('!!! BŁĄD AUTORYZACJI !!! - Sprawdź klucz API i uprawnienia');
      }
      
      // Jeśli status jest 404, oznacza to problem z endpointem
      if (proxyRes.statusCode === 404) {
        console.error('!!! ENDPOINT NIE ZNALEZIONY !!! - Sprawdź poprawność endpointu API:', req.url);
        console.log('  Przekształcony URL:', req.url.replace(/^\/api/, '/webapi/rest/v5'));
      }
      
      // Jeśli status jest 400, może to oznaczać problem z danymi wejściowymi
      if (proxyRes.statusCode === 400) {
        console.error('!!! NIEPOPRAWNE DANE !!! - Sprawdź format danych wysyłanych do API');
        
        // Próbujemy wyłuskać komunikat błędu z odpowiedzi, ale jako strumień
        let responseBody = '';
        proxyRes.on('data', chunk => {
          responseBody += chunk.toString();
        });
        
        proxyRes.on('end', () => {
          try {
            console.log('  Odpowiedź z serwera przy błędzie 400:', responseBody);
          } catch (e) {
            console.error('  Nie można sparsować odpowiedzi jako JSON:', e.message);
            console.log('  Raw error response:', responseBody);
          }
        });
      }
    } catch (e) {
      console.error('  Błąd podczas przetwarzania odpowiedzi proxy:', e.message);
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err, err.stack);
    // Upewniamy się, że odpowiedź nie została jeszcze wysłana
    if (!res.headersSent) {
      res.status(500).json({ error: `Proxy Error: ${err.message}` });
    }
  }
};

// Tworzymy aplikację Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY', 'X-API-VERSION', 'X-Shop-Id', 'Accept', 'x-requested-with', 'x-api-key', 'x-api-version', 'x-shop-id', 'X-Action-Type', 'x-action-type'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Bezpośrednia obsługa OPTIONS dla wszystkich ścieżek
app.options('*', (req, res) => {
  console.log('Obsługa żądania OPTIONS:', req.url);
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-KEY, X-API-VERSION, X-Shop-Id, Accept, x-requested-with, x-api-key, x-api-version, x-shop-id, X-Action-Type, x-action-type');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Endpoint testowy - sprawdzenie czy serwer działa
app.get('/status', (req, res) => {
  res.json({ status: 'ok', message: 'Serwer proxy IdoSell działa' });
});

// Konfiguracja proxy dla endpointów API IdoSell
app.use('/api', createProxyMiddleware({
  ...proxyOptions,
  onProxyRes: (proxyRes, req, res) => {
    // Dodajemy nagłówki CORS do każdej odpowiedzi
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-KEY, X-API-VERSION, X-Shop-Id, Accept, x-requested-with, x-api-key, x-api-version, x-shop-id, X-Action-Type, x-action-type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Wywołujemy oryginalną funkcję onProxyRes
    if (proxyOptions.onProxyRes) {
      proxyOptions.onProxyRes(proxyRes, req, res);
    }
  }
}));

// Uruchomienie serwera
app.listen(PORT, () => {
  console.log(`Serwer proxy działa na porcie ${PORT}`);
  console.log(`Proxy kieruje zapytania z http://localhost:${PORT}/api do ${proxyOptions.target}${proxyOptions.pathRewrite['^/api']}`);
}); 