### Env setup

Create a `.env` file in backend:

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/yourdbname
JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_openai_api_key
```

### Run app

1. Backend server
```bash
cd backend
npm install
node app.js
```

2. Start electron app
```bash
cd frontend
npm install
npm start
```
