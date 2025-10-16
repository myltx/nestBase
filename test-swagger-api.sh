#!/bin/bash

# 测试 OpenAPI JSON 接口
echo "🧪 Testing OpenAPI JSON Endpoint..."
echo ""

# 等待服务启动
echo "⏳ Waiting for service to start..."
for i in {1..10}; do
  if curl -s http://localhost:3001/api/swagger/stats > /dev/null 2>&1; then
    echo "✅ Service is ready!"
    break
  fi
  echo "  Attempt $i/10..."
  sleep 2
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 Test 1: OpenAPI JSON Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s http://localhost:3001/api/swagger/json)

# 检查是否直接返回 JSON（不包装在 data 中）
if echo "$RESPONSE" | grep -q '"openapi"'; then
  echo "✅ Response format is correct (direct JSON)"
  echo "✅ Contains 'openapi' field"
else
  echo "❌ Response format is incorrect"
  echo "Response preview:"
  echo "$RESPONSE" | head -n 5
  exit 1
fi

# 检查是否有 success 字段（不应该有）
if echo "$RESPONSE" | grep -q '"success"'; then
  echo "❌ Response should NOT contain 'success' field (found wrapped response)"
  echo "Response preview:"
  echo "$RESPONSE" | head -n 10
  exit 1
else
  echo "✅ Response is NOT wrapped (no 'success' field)"
fi

# 检查必需字段
if echo "$RESPONSE" | grep -q '"info"'; then
  echo "✅ Contains 'info' field"
fi

if echo "$RESPONSE" | grep -q '"paths"'; then
  echo "✅ Contains 'paths' field"
fi

if echo "$RESPONSE" | grep -q '"components"'; then
  echo "✅ Contains 'components' field"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test 2: API Stats (Should be wrapped)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

STATS_RESPONSE=$(curl -s http://localhost:3001/api/swagger/stats)

# stats 接口应该有包装
if echo "$STATS_RESPONSE" | grep -q '"success"'; then
  echo "✅ Stats response is correctly wrapped"
else
  echo "❌ Stats response should be wrapped"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "OpenAPI JSON URL: http://localhost:3001/api/swagger/json"
echo "API Stats URL: http://localhost:3001/api/swagger/stats"
echo ""
echo "✅ Ready for Apifox import!"
echo ""
