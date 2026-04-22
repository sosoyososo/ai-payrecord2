# PayRecord App - 开发命令

.PHONY: help
help: ## 显示所有可用命令
	@echo "PayRecord App 开发命令"
	@echo ""
	@echo "Web 开发:"
	@echo "  make web        - 启动 Web 开发服务器 (http://localhost:5173)"
	@echo "  make build      - 构建 Web 生产版本到 dist/"
	@echo ""
	@echo "iOS 开发:"
	@echo "  make sync-ios    - 同步 Web 资源到 iOS 项目"
	@echo "  make open-ios    - 在 Xcode 中打开 iOS 项目"
	@echo "  make run-ios     - 构建并运行到 iOS 模拟器"
	@echo "  make run-ios TARGET=iPhone\\ 16\\ Pro  - 运行到指定模拟器"
	@echo ""
	@echo "Android 开发:"
	@echo "  make sync-android - 同步 Web 资源到 Android 项目"
	@echo "  make open-android - 在 Android Studio 中打开 Android 项目"
	@echo "  make run-android  - 构建并运行到 Android 模拟器"
	@echo ""
	@echo "完整流程:"
	@echo "  make dev-ios     - 构建 + 同步 + 运行 iOS (开发流程)"
	@echo "  make dev-android - 构建 + 同步 + 运行 Android (开发流程)"

# ============ Web 开发 ============

web: ## 启动 Web 开发服务器
	cd frontend && npm run dev

build: ## 构建 Web 生产版本
	cd frontend && npm run build

# ============ iOS ============

sync-ios: ## 同步 Web 资源到 iOS 项目
	cd frontend && npx cap sync ios

open-ios: ## 在 Xcode 中打开 iOS 项目
	cd frontend && npx cap open ios

run-ios: ## 构建并运行到 iOS 模拟器
	cd frontend && npx cap run ios$(if $(TARGET), --target "$(TARGET)",)

dev-ios: build sync-ios run-ios ## 完整开发流程: 构建 + 同步 + 运行 iOS

# ============ Android ============

sync-android: ## 同步 Web 资源到 Android 项目
	cd frontend && npx cap sync android

open-android: ## 在 Android Studio 中打开 Android 项目
	cd frontend && npx cap open android

run-android: ## 构建并运行到 Android 模拟器
	cd frontend && npx cap run android

dev-android: build sync-android run-android ## 完整开发流程: 构建 + 同步 + 运行 Android

# ============ 多平台同步 ============

sync-all: build sync-ios sync-android ## 构建并同步到所有平台

# ============ 模拟器列表 ============

list-ios: ## 列出可用 iOS 模拟器
	cd frontend && npx cap run ios --list

list-android: ## 列出可用 Android 模拟器
	cd frontend && npx cap run android --list