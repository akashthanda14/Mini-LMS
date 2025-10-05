#!/bin/bash

# Quick Backend API Test Script
# Tests all fixed endpoints

echo "🧪 Testing Backend API Fixes..."
echo "================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get admin token
echo -e "\n${YELLOW}1. Getting admin token...${NC}"
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"admin@example.com","password":"Admin@123"}' \
  | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Failed to get admin token. Check credentials.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Got admin token${NC}"

# Test Growth Analytics
echo -e "\n${YELLOW}2. Testing Growth Analytics...${NC}"
GROWTH=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/metrics/growth)

if echo "$GROWTH" | jq -e '.data.certificates.growthRate' > /dev/null 2>&1; then
  CERT_RATE=$(echo "$GROWTH" | jq -r '.data.certificates.growthRate')
  echo -e "${GREEN}✅ Growth Analytics: certificates.growthRate = $CERT_RATE${NC}"
else
  echo -e "${RED}❌ Growth Analytics: Missing certificates.growthRate${NC}"
fi

if echo "$GROWTH" | jq -e '.data.users.growth' > /dev/null 2>&1; then
  USER_GROWTH=$(echo "$GROWTH" | jq -r '.data.users.growth')
  echo -e "${GREEN}✅ Growth Analytics: users.growth = $USER_GROWTH${NC}"
else
  echo -e "${RED}❌ Growth Analytics: Missing users.growth${NC}"
fi

# Test Top Courses
echo -e "\n${YELLOW}3. Testing Top Courses...${NC}"
TOP_COURSES=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/metrics/top-courses?limit=5)

if echo "$TOP_COURSES" | jq -e '.data.courses' > /dev/null 2>&1; then
  COURSE_COUNT=$(echo "$TOP_COURSES" | jq -r '.data.courses | length')
  echo -e "${GREEN}✅ Top Courses: Wrapped in courses array (count: $COURSE_COUNT)${NC}"
  
  if echo "$TOP_COURSES" | jq -e '.data.courses[0].averageProgress' > /dev/null 2>&1; then
    AVG_PROGRESS=$(echo "$TOP_COURSES" | jq -r '.data.courses[0].averageProgress // "N/A"')
    echo -e "${GREEN}✅ Top Courses: averageProgress = $AVG_PROGRESS${NC}"
  else
    echo -e "${RED}❌ Top Courses: Missing averageProgress${NC}"
  fi
else
  echo -e "${RED}❌ Top Courses: Not wrapped in courses array${NC}"
fi

# Test Recent Activity
echo -e "\n${YELLOW}4. Testing Recent Activity...${NC}"
ACTIVITY=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/metrics/activity?limit=10)

if echo "$ACTIVITY" | jq -e '.data.activities' > /dev/null 2>&1; then
  ACTIVITY_COUNT=$(echo "$ACTIVITY" | jq -r '.data.activities | length')
  echo -e "${GREEN}✅ Recent Activity: Wrapped in activities array (count: $ACTIVITY_COUNT)${NC}"
  
  if [ "$ACTIVITY_COUNT" -gt 0 ]; then
    ACTIVITY_ID=$(echo "$ACTIVITY" | jq -r '.data.activities[0].id // "N/A"')
    ACTIVITY_TYPE=$(echo "$ACTIVITY" | jq -r '.data.activities[0].type // "N/A"')
    HAS_METADATA=$(echo "$ACTIVITY" | jq -e '.data.activities[0].metadata' > /dev/null 2>&1 && echo "yes" || echo "no")
    
    echo -e "${GREEN}✅ Recent Activity: id = $ACTIVITY_ID${NC}"
    echo -e "${GREEN}✅ Recent Activity: type = $ACTIVITY_TYPE${NC}"
    
    if [ "$HAS_METADATA" = "yes" ]; then
      echo -e "${GREEN}✅ Recent Activity: Uses 'metadata' field${NC}"
    else
      echo -e "${RED}❌ Recent Activity: Missing 'metadata' field${NC}"
    fi
  fi
else
  echo -e "${RED}❌ Recent Activity: Not wrapped in activities array${NC}"
fi

# Test Pending Applications
echo -e "\n${YELLOW}5. Testing Pending Applications...${NC}"
APPLICATIONS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/applications/pending)

if echo "$APPLICATIONS" | jq -e '.applications' > /dev/null 2>&1; then
  APP_COUNT=$(echo "$APPLICATIONS" | jq -r '.count')
  echo -e "${GREEN}✅ Pending Applications: Found $APP_COUNT applications${NC}"
  
  if [ "$APP_COUNT" -gt 0 ]; then
    HAS_ROLE=$(echo "$APPLICATIONS" | jq -e '.applications[0].applicant.role' > /dev/null 2>&1 && echo "yes" || echo "no")
    HAS_REVIEWED_AT=$(echo "$APPLICATIONS" | jq -e '.applications[0].reviewedAt' > /dev/null 2>&1 && echo "yes" || echo "no")
    
    if [ "$HAS_ROLE" = "yes" ]; then
      ROLE=$(echo "$APPLICATIONS" | jq -r '.applications[0].applicant.role')
      echo -e "${GREEN}✅ Pending Applications: applicant.role = $ROLE${NC}"
    else
      echo -e "${RED}❌ Pending Applications: Missing applicant.role${NC}"
    fi
    
    if [ "$HAS_REVIEWED_AT" = "yes" ]; then
      echo -e "${GREEN}✅ Pending Applications: Has reviewedAt field${NC}"
    else
      echo -e "${RED}❌ Pending Applications: Missing reviewedAt${NC}"
    fi
  fi
else
  echo -e "${RED}❌ Pending Applications: Invalid response${NC}"
fi

# Test Pending Courses
echo -e "\n${YELLOW}6. Testing Pending Courses...${NC}"
COURSES=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/courses/pending)

if echo "$COURSES" | jq -e '.courses' > /dev/null 2>&1; then
  COURSE_COUNT=$(echo "$COURSES" | jq -r '.count')
  echo -e "${GREEN}✅ Pending Courses: Found $COURSE_COUNT courses${NC}"
  
  if [ "$COURSE_COUNT" -gt 0 ]; then
    HAS_THUMBNAIL_URL=$(echo "$COURSES" | jq -e '.courses[0].thumbnailUrl' > /dev/null 2>&1 && echo "yes" || echo "no")
    HAS_LESSONS=$(echo "$COURSES" | jq -e '.courses[0].lessons' > /dev/null 2>&1 && echo "yes" || echo "no")
    HAS_CREATED_AT=$(echo "$COURSES" | jq -e '.courses[0].createdAt' > /dev/null 2>&1 && echo "yes" || echo "no")
    
    if [ "$HAS_THUMBNAIL_URL" = "yes" ]; then
      echo -e "${GREEN}✅ Pending Courses: Uses thumbnailUrl${NC}"
    else
      echo -e "${RED}❌ Pending Courses: Missing thumbnailUrl${NC}"
    fi
    
    if [ "$HAS_LESSONS" = "yes" ]; then
      LESSON_COUNT=$(echo "$COURSES" | jq -r '.courses[0].lessons | length')
      echo -e "${GREEN}✅ Pending Courses: Has lessons array (count: $LESSON_COUNT)${NC}"
    else
      echo -e "${RED}❌ Pending Courses: Missing lessons array${NC}"
    fi
    
    if [ "$HAS_CREATED_AT" = "yes" ]; then
      echo -e "${GREEN}✅ Pending Courses: Has createdAt field${NC}"
    else
      echo -e "${RED}❌ Pending Courses: Missing createdAt${NC}"
    fi
  fi
else
  echo -e "${RED}❌ Pending Courses: Invalid response${NC}"
fi

# Summary
echo -e "\n${YELLOW}================================${NC}"
echo -e "${GREEN}✅ Backend API testing complete!${NC}"
echo -e "${YELLOW}================================${NC}"
