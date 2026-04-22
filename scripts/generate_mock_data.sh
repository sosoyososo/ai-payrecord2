#!/bin/bash

# ============================================================
# Mock Data Generator for ai-payrecord2
# Generates 3000 records distributed over ~3 years using online API
# ============================================================

set -e

API_BASE="https://api.payrecord.ai.karsa.info/api/v1"
EMAIL="596291630@qq.com"
PASSWORD="test123456"
LEDGER_ID=5
TOTAL_RECORDS=3000
BATCH_SIZE=50

# Date range: 3 years ago to today
END_DATE=$(date +%Y-%m-%d)
START_DATE=$(date -v-3y +%Y-%m-%d 2>/dev/null || date --date="3 years ago" +%Y-%m-%d)

echo "=== Mock Data Generator ==="
echo "Date range: $START_DATE to $END_DATE"
echo "Total records: $TOTAL_RECORDS"
echo ""

# Step 1: Login to get token
echo "[1/3] Logging in..."
LOGIN_RESP=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESP | jq -r '.data.access_token')
if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "ERROR: Login failed"
  echo $LOGIN_RESP | jq .
  exit 1
fi
echo "Login successful!"

# Step 2: Define categories arrays
EXPENSE_CATS="61 62 63 64 65 66 67 68 69 70"
INCOME_CATS="71 72 73 74 75"

# Step 3: Helper functions

get_expense_cat() {
  echo $EXPENSE_CATS | tr ' ' '\n' | shuf -n 1
}

get_income_cat() {
  echo $INCOME_CATS | tr ' ' '\n' | shuf -n 1
}

# Get note for expense category
get_expense_note() {
  case $1 in
    61) echo "餐饮" ;;
    62) echo "交通" ;;
    63) echo "购物" ;;
    64) echo "居住" ;;
    65) echo "娱乐" ;;
    66) echo "医疗" ;;
    67) echo "教育" ;;
    68) echo "通讯" ;;
    69) echo "旅行" ;;
    70) echo "其他" ;;
    *) echo "支出" ;;
  esac
}

# Get note for income category
get_income_note() {
  case $1 in
    71) echo "工资发放" ;;
    72) echo "年终奖金" ;;
    73) echo "投资收益" ;;
    74) echo "兑换红包" ;;
    75) echo "其他收入" ;;
    *) echo "收入" ;;
  esac
}

# Generate random integer between min and max
rand_int() {
  local min=$1
  local max=$2
  echo $((min + RANDOM % (max - min + 1)))
}

# Generate weighted random date
generate_date() {
  START_SECS=$(date -j -f "%Y-%m-%d" "$START_DATE" +%s 2>/dev/null || date --date="$START_DATE" +%s)
  END_SECS=$(date -j -f "%Y-%m-%d" "$END_DATE" +%s 2>/dev/null || date --date="$END_DATE" +%s)
  RANGE=$((END_SECS - START_SECS))
  RANDOM_SECS=$((START_SECS + RANDOM % RANGE))
  DATE=$(date -j -r $RANDOM_SECS +%Y-%m-%d 2>/dev/null || date --date="@$RANDOM_SECS" +%Y-%m-%d)

  DAY_OF_WEEK=$(date -j -r $RANDOM_SECS +%u 2>/dev/null || date --date="@$RANDOM_SECS" +%u)
  DAY_OF_MONTH=$(date -j -r $RANDOM_SECS +%d 2>/dev/null || date --date="@$RANDOM_SECS" +%d)

  # Weekend penalty
  if [ "$DAY_OF_WEEK" -eq 6 ] || [ "$DAY_OF_WEEK" -eq 7 ]; then
    if [ $((RANDOM % 100)) -lt 40 ]; then
      generate_date
      return
    fi
  fi

  # Middle of month penalty (6-24)
  if [ "$DAY_OF_MONTH" -ge 6 ] && [ "$DAY_OF_MONTH" -le 24 ]; then
    if [ $((RANDOM % 100)) -lt 50 ]; then
      generate_date
      return
    fi
  fi

  echo "$DATE"
}

# Generate expense amount (¥20-¥2000)
generate_expense_amount() {
  local roll=$((RANDOM % 100))
  if [ $roll -lt 5 ]; then
    rand_int 500 2000
  elif [ $roll -lt 15 ]; then
    rand_int 200 500
  else
    rand_int 20 200
  fi
}

# Generate income amount (¥3000-¥15000)
generate_income_amount() {
  rand_int 3000 15000
}

# Create a single record
create_record() {
  local TYPE=$1
  local CAT_ID=$2
  local AMOUNT=$3
  local DATE=$4
  local NOTE=$5

  curl -s -X POST "$API_BASE/records" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"ledger_id\": $LEDGER_ID,
      \"category_id\": $CAT_ID,
      \"amount\": $AMOUNT,
      \"type\": $TYPE,
      \"date\": \"${DATE}T00:00:00Z\",
      \"note\": \"$NOTE\"
    }"
}

echo "[2/3] Generating $TOTAL_RECORDS records..."
echo ""

# Step 4: Generate records
SUCCESS=0
FAIL=0

for i in $(seq 1 $TOTAL_RECORDS); do
  # 70% expense, 30% income
  if [ $((RANDOM % 100)) -lt 70 ]; then
    TYPE=2
    CAT_ID=$(get_expense_cat)
    AMOUNT=$(generate_expense_amount)
    NOTE=$(get_expense_note $CAT_ID)
  else
    TYPE=1
    CAT_ID=$(get_income_cat)
    AMOUNT=$(generate_income_amount)
    NOTE=$(get_income_note $CAT_ID)
  fi

  DATE=$(generate_date)

  RESP=$(create_record $TYPE $CAT_ID $AMOUNT "$DATE" "$NOTE")
  CODE=$(echo $RESP | jq -r '.code')

  if [ "$CODE" = "0" ]; then
    SUCCESS=$((SUCCESS + 1))
  else
    FAIL=$((FAIL + 1))
  fi

  # Progress every 100 records
  if [ $((i % 100)) -eq 0 ]; then
    echo "Progress: $i / $TOTAL_RECORDS (success: $SUCCESS, fail: $FAIL)"
  fi

  # Brief delay every batch
  if [ $((i % BATCH_SIZE)) -eq 0 ]; then
    sleep 0.3
  fi
done

echo ""
echo "[3/3] Done!"
echo "Total: $TOTAL_RECORDS | Success: $SUCCESS | Failed: $FAIL"
