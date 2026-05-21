SHELL := /bin/bash
.DEFAULT_GOAL := help

APP_DIR ?= .
NPM ?= npm
HOST ?= 127.0.0.1
PORT ?= 5175
PREVIEW_PORT ?= 4175
LOCAL_PORT ?= 8889

.PHONY: help install dev build preview test test-watch verify

help:
	@printf '%s\n' \
		'Targets:' \
		'  make install         - 의존성 설치' \
		'  make dev             - vite 개발 서버 (http://localhost:$(PORT))' \
		'  make build           - 프로덕션 빌드' \
		'  make preview         - 빌드 프리뷰' \
		'  make test            - vitest 실행' \
		'  make test-watch      - vitest watch 모드' \
		'  make verify          - build + test'

install:
	$(NPM) install

dev:
	$(NPM) run dev -- --host "$(HOST)" --port "$(PORT)"

build:
	$(NPM) run build

preview:
	$(NPM) run preview -- --host "$(HOST)" --port "$(PREVIEW_PORT)"

test:
	$(NPM) run test:run

test-watch:
	$(NPM) test

verify: build test
