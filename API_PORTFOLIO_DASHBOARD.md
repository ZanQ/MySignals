# Portfolio Dashboard API

## Endpoint
**POST** `/v1/portfolio/dashboard`

## Description
Returns comprehensive portfolio statistics including current holdings, historical trades, YTD and all-time performance metrics for the authenticated user.

## Authentication
This endpoint requires authentication. Include a Bearer token in the Authorization header.

## Request

### Headers
```
Authorization: Bearer <your_access_token>
Content-Type: application/json
```

### cURL Example
```bash
curl -X POST http://localhost:3000/v1/portfolio/dashboard \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### JavaScript/Fetch Example
```javascript
const response = await fetch('http://localhost:3000/v1/portfolio/dashboard', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'Content-Type': 'application/json'
  }
});

const dashboard = await response.json();
console.log(dashboard);
```

### Axios Example
```javascript
const axios = require('axios');

const getDashboard = async (accessToken) => {
  try {
    const response = await axios.post(
      'http://localhost:3000/v1/portfolio/dashboard',
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard:', error.response?.data || error.message);
    throw error;
  }
};

// Usage
const dashboard = await getDashboard('your_access_token_here');
```

## Response

### Success Response (200 OK)
```json
{
  "summary": {
    "total_active_positions": 5,
    "unique_tickers": 3,
    "total_invested": 15000.00,
    "total_trades": 25
  },
  "current_holdings": [
    {
      "ticker": "AAPL",
      "total_shares": 100,
      "avg_entry_price": 150.00,
      "total_invested": 15000.00,
      "position_count": 2,
      "positions": [
        {
          "id": "507f1f77bcf86cd799439011",
          "entry_price": 145.00,
          "entry_date": "2025-01-15",
          "shares": 50
        },
        {
          "id": "507f1f77bcf86cd799439012",
          "entry_price": 155.00,
          "entry_date": "2025-02-10",
          "shares": 50
        }
      ]
    }
  ],
  "performance": {
    "ytd": {
      "trades": 10,
      "profit": 2500.00,
      "return_pct": 15.5,
      "invested": 16129.03
    },
    "all_time": {
      "trades": 25,
      "profit": 8750.00,
      "return_pct": 22.35,
      "invested": 39150.00
    }
  },
  "trading_stats": {
    "total_trades": 25,
    "winning_trades": 18,
    "losing_trades": 7,
    "win_rate": 72.00,
    "avg_win": 650.25,
    "avg_loss": -245.50,
    "profit_factor": 2.65,
    "largest_win": 1850.00,
    "largest_loss": -580.00
  },
  "recent_trades": [
    {
      "id": "507f1f77bcf86cd799439013",
      "ticker": "TSLA",
      "profit": 450.00,
      "return_pct": 15.5,
      "exit_date": "2026-01-01",
      "closed_at": "2026-01-01T10:30:00.000Z"
    }
  ],
  "historical_trades": [
    {
      "id": "507f1f77bcf86cd799439013",
      "ticker": "TSLA",
      "entry_price": 250.00,
      "entry_date": "2025-12-01",
      "exit_price": 265.00,
      "exit_date": "2026-01-01",
      "shares": 30,
      "profit": 450.00,
      "return_pct": 6.00,
      "exit_reason": "Target reached",
      "closed_at": "2026-01-01T10:30:00.000Z"
    }
  ]
}
```

### Error Response (401 Unauthorized)
```json
{
  "code": 401,
  "message": "Please authenticate"
}
```

## Data Fields Explanation

### Summary
- `total_active_positions`: Number of open positions
- `unique_tickers`: Number of different stocks in portfolio
- `total_invested`: Total capital invested in active positions
- `total_trades`: Total number of completed trades

### Current Holdings
- `ticker`: Stock symbol
- `total_shares`: Combined shares across all positions
- `avg_entry_price`: Average weighted entry price
- `total_invested`: Total capital in this ticker
- `position_count`: Number of separate positions in this ticker
- `positions`: Array of individual positions

### Performance
- `ytd`: Year-to-date statistics (January 1 to current date)
- `all_time`: All-time trading statistics
- `profit`: Realized profit/loss in dollars
- `return_pct`: Percentage return on investment

### Trading Stats
- `win_rate`: Percentage of profitable trades
- `avg_win`: Average profit from winning trades
- `avg_loss`: Average loss from losing trades
- `profit_factor`: Ratio of average win to average loss
- `largest_win/loss`: Best and worst single trades

## Notes

1. **Authentication Required**: You must be logged in and have a valid access token
2. **User-Specific**: Returns data only for the authenticated user
3. **Real-time Calculation**: Stats are calculated on-demand from database
4. **YTD Reset**: Year-to-date statistics reset on January 1st each year
5. **Empty Portfolio**: Returns zeros/empty arrays if no trades exist
