#!/bin/bash

# ==========================================
# سكربت نشر منصة زايلو على Northflank
# ==========================================

# الألوان للطباعة
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   🚀 نشر منصة زايلو على Northflank${NC}"
echo -e "${BLUE}========================================${NC}"

# التحقق من المتطلبات
echo -e "\n${YELLOW}📋 التحقق من المتطلبات...${NC}"

# التحقق من Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker غير مثبت. يرجى تثبيته أولاً.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker موجود${NC}"

# التحقق من Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git غير مثبت. يرجى تثبيته أولاً.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Git موجود${NC}"

# التحقق من المتغيرات المطلوبة
echo -e "\n${YELLOW}🔐 التحقق من متغيرات البيئة...${NC}"

if [ -z "$NORTHFLANK_TOKEN" ]; then
    echo -e "${YELLOW}⚠️ NORTHFLANK_TOKEN غير محدد${NC}"
    echo -e "   يمكنك الحصول على التوكن من: https://app.northflank.com/settings/api-tokens"
    read -p "   أدخل Northflank API Token: " NORTHFLANK_TOKEN
    export NORTHFLANK_TOKEN
fi
echo -e "${GREEN}✅ NORTHFLANK_TOKEN موجود${NC}"

if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️ DATABASE_URL غير محدد${NC}"
    read -p "   أدخل PostgreSQL Connection String: " DATABASE_URL
    export DATABASE_URL
fi
echo -e "${GREEN}✅ DATABASE_URL موجود${NC}"

# إعداد المشروع
PROJECT_ID="${PROJECT_ID:-}"
SERVICE_NAME="${SERVICE_NAME:-xylo-platform}"
REGION="${REGION:-europe-west2}"

echo -e "\n${BLUE}📦 إعداد المشروع...${NC}"

# الحصول على قائمة المشاريع
echo -e "${YELLOW}   جاري الحصول على المشاريع...${NC}"
PROJECTS_RESPONSE=$(curl -s -X GET "https://api.northflank.com/v1/projects" \
    -H "Authorization: Bearer $NORTHFLANK_TOKEN" \
    -H "Content-Type: application/json")

if [ -z "$PROJECT_ID" ]; then
    # عرض المشاريع المتاحة
    echo -e "${YELLOW}   المشاريع المتاحة:${NC}"
    echo "$PROJECTS_RESPONSE" | jq -r '.data[] | "   [\(.id)] \(.name)"' 2>/dev/null || echo "   لم يتم العثور على مشاريع"
    
    read -p "   أدخل Project ID (أو اضغط Enter لإنشاء مشروع جديد): " PROJECT_ID
fi

# إنشاء مشروع جديد إذا لم يكن محدداً
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}   إنشاء مشروع جديد...${NC}"
    CREATE_PROJECT_RESPONSE=$(curl -s -X POST "https://api.northflank.com/v1/projects" \
        -H "Authorization: Bearer $NORTHFLANK_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Xylo Platform\",
            \"description\": \"منصة دعم صُنّاع المحتوى العربي\"
        }")
    
    PROJECT_ID=$(echo "$CREATE_PROJECT_RESPONSE" | jq -r '.id' 2>/dev/null)
    
    if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" == "null" ]; then
        echo -e "${RED}❌ فشل في إنشاء المشروع${NC}"
        echo "$CREATE_PROJECT_RESPONSE"
        exit 1
    fi
    echo -e "${GREEN}✅ تم إنشاء المشروع: $PROJECT_ID${NC}"
fi

# بناء الصورة
echo -e "\n${BLUE}🔨 بناء Docker Image...${NC}"
docker build -t xylo-platform:latest .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ فشل في بناء الصورة${NC}"
    exit 1
fi
echo -e "${GREEN}✅ تم بناء الصورة بنجاح${NC}"

# طلب معلومات المستودع
echo -e "\n${YELLOW}📁 معلومات المستودع:${NC}"
read -p "   Git Repository URL (GitHub/GitLab): " GIT_REPO
read -p "   Branch (default: main): " GIT_BRANCH
GIT_BRANCH=${GIT_BRANCH:-main}

# إنشاء الخدمة
echo -e "\n${BLUE}🚀 إنشاء خدمة النشر...${NC}"

DEPLOYMENT_CONFIG=$(cat <<EOF
{
    "name": "$SERVICE_NAME",
    "description": "منصة دعم صُنّاع المحتوى العربي",
    "deployment": {
        "instances": 1,
        "storage": {
            "ephemeral": {
                "storageSize": "1GB"
            }
        },
        "resources": {
            "cpu": "0.5",
            "memory": "512MB"
        }
    },
    "buildSettings": {
        "dockerfile": {
            "buildEngine": "cloudBuild",
            "dockerFilePath": "./Dockerfile",
            "dockerWorkDir": "./"
        },
        "source": {
            "git": {
                "branch": "$GIT_BRANCH"
            }
        }
    },
    "runtimeEnvironment": {
        "DATABASE_URL": "$DATABASE_URL",
        "JWT_SECRET": "xylo-production-jwt-secret-$(openssl rand -hex 16)",
        "NODE_ENV": "production",
        "NEXT_TELEMETRY_DISABLED": "1"
    },
    "ports": [
        {
            "name": "http",
            "internalPort": 3000,
            "public": true,
            "protocol": "HTTP"
        }
    ]
}
EOF
)

echo -e "${YELLOW}   جاري إنشاء الخدمة...${NC}"
CREATE_SERVICE_RESPONSE=$(curl -s -X POST "https://api.northflank.com/v1/projects/$PROJECT_ID/services/deployments" \
    -H "Authorization: Bearer $NORTHFLANK_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$DEPLOYMENT_CONFIG")

SERVICE_ID=$(echo "$CREATE_SERVICE_RESPONSE" | jq -r '.id' 2>/dev/null)

if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" == "null" ]; then
    echo -e "${RED}❌ فشل في إنشاء الخدمة${NC}"
    echo "$CREATE_SERVICE_RESPONSE"
    exit 1
fi
echo -e "${GREEN}✅ تم إنشاء الخدمة: $SERVICE_ID${NC}"

# ربط المستودع
echo -e "\n${BLUE}🔗 ربط المستودع...${NC}"
echo -e "${YELLOW}   يرجى ربط المستودع يدوياً من لوحة تحكم Northflank${NC}"
echo -e "   أو استخدم: https://app.northflank.com/projects/$PROJECT_ID/services/$SERVICE_ID"

# الانتظار حتى يصبح النشر جاهزاً
echo -e "\n${BLUE}⏳ انتظار النشر...${NC}"
echo -e "${YELLOW}   يمكن متابعة التقدم من لوحة التحكم${NC}"

# عرض النتيجة
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   ✅ تم إعداد النشر بنجاح!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "📋 معلومات النشر:"
echo -e "   Project ID: ${BLUE}$PROJECT_ID${NC}"
echo -e "   Service ID: ${BLUE}$SERVICE_ID${NC}"
echo -e "   Service Name: ${BLUE}$SERVICE_NAME${NC}"
echo ""
echo -e "🌐 للوصول للمنصة:"
echo -e "   https://app.northflank.com/projects/$PROJECT_ID/services/$SERVICE_ID"
echo ""
echo -e "📝 الخطوات التالية:"
echo -e "   1. اربط مستودع Git من إعدادات الخدمة"
echo -e "   2. أضف Domain مخصص (اختياري)"
echo -e "   3. راقب Build Logs للتحقق من النجاح"
echo ""
echo -e "🔐 بيانات الدخول الافتراضية:"
echo -e "   البريد: ${YELLOW}admin@xylo.com${NC}"
echo -e "   كلمة المرور: ${YELLOW}admin123456${NC}"
echo -e "   ${RED}⚠️ غيّر كلمة المرور فوراً بعد الدخول!${NC}"
