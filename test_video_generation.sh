#!/bin/bash

# Test Script for VEO and SORA Video Generation
# Usage: bash test_video_generation.sh

API_URL="http://localhost:5000/api"
TOKEN="YOUR_JWT_TOKEN_HERE"

echo "🎬 Test de génération vidéo VEO et SORA"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Récupérer les générateurs disponibles
echo -e "\n${BLUE}Test 1: Récupérer les générateurs disponibles${NC}"
echo "GET /api/videos/generators/available"

curl -X GET \
  "$API_URL/videos/generators/available" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -s | jq '.'

# Test 2: Générer une vidéo avec VEO
echo -e "\n${BLUE}Test 2: Générer une vidéo avec VEO${NC}"
echo "POST /api/videos/generate (videoGenerator: veo)"

curl -X POST \
  "$API_URL/videos/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "promptText": "Un magnifique coucher de soleil sur une plage tropicale avec des palmiers",
    "format": "youtube",
    "variants": 1,
    "videoGenerator": "veo"
  }' \
  -s | jq '.'

# Test 3: Générer une vidéo avec SORA
echo -e "\n${BLUE}Test 3: Générer une vidéo avec SORA${NC}"
echo "POST /api/videos/generate (videoGenerator: sora)"

curl -X POST \
  "$API_URL/videos/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "promptText": "Une montagne enneigée avec des loups en hiver",
    "format": "short",
    "variants": 2,
    "videoGenerator": "sora"
  }' \
  -s | jq '.'

# Test 4: Générer une vidéo sans spécifier (utilise le défaut)
echo -e "\n${BLUE}Test 4: Générer une vidéo (générateur par défaut)${NC}"
echo "POST /api/videos/generate (pas de videoGenerator)"

curl -X POST \
  "$API_URL/videos/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "promptText": "Des aurores boréales dansant dans le ciel arctique",
    "format": "youtube",
    "variants": 1
  }' \
  -s | jq '.'

# Test 5: Générer avec format "both" et variantes
echo -e "\n${BLUE}Test 5: Générer avec format both et variantes${NC}"
echo "POST /api/videos/generate (format: both, variants: 3)"

curl -X POST \
  "$API_URL/videos/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "promptText": "Une forêt mystérieuse avec des créatures fantastiques",
    "format": "both",
    "variants": 3,
    "videoGenerator": "veo"
  }' \
  -s | jq '.'

# Test 6: Récupérer toutes les vidéos de l'utilisateur
echo -e "\n${BLUE}Test 6: Récupérer toutes les vidéos${NC}"
echo "GET /api/videos"

curl -X GET \
  "$API_URL/videos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -s | jq '.'

echo -e "\n${GREEN}✅ Tests terminés!${NC}"
echo -e "${YELLOW}Note: Remplacez YOUR_JWT_TOKEN_HERE par votre vrai token${NC}"
