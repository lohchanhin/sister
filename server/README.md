# Marketing System Server

> VERTEX SOLUTION \u5167\u90e8\u884c\u92b7\u7cfb\u7d71 \u2013 Node.js + Express + MongoDB

## \u5b89\u88dd

```bash
cp .env.example .env       # \u4fee\u6539\u4f60\u7684 MongoDB\u3001JWT \u7b49\u8a2d\u5b9a
npm install
npm run dev                # nodemon \u71b1\u91cd\u8f09
```

\u4f3a\u670d\u5668\u555f\u52d5\u5f8c\uff0c\u975c\u614b\u6a94\u6848\u53ef\u900f\u904e /static/<filename> \u5b58\u53d6\uff0cAPI \u6839\u8def\u5f91\u70ba /api/*\u3002

---

## 5. \u555f\u52d5\u8207\u6e2c\u8a66

1. **\u8a2d\u5b9a `.env`**\uff1a\u8907\u88fd `.env.example`\uff0c\u8f38\u5165\u6b63\u78ba\u7684 `MONGODB_URI` \u8207 `JWT_SECRET`\u3002
2. **\u555f\u52d5 MongoDB**\uff08\u672c\u6a5f\u6216 Atlas\uff09\u3002
3. `npm run dev` \u2192 \u770b\u5230 `\u2705 MongoDB \u5df2\u9023\u7dda` \u8207 `\uD83D\uDE80 Server running` \u5373\u6210\u529f\u3002
4. \u4f7f\u7528 Postman / cURL \u6e2c\u8a66\uff1a
   ```bash
   # \u767b\u5165
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"mypwd"}'
   ```
