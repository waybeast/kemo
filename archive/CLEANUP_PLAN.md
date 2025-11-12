# Project Cleanup Plan

## 📁 Files to Remove

### Root Directory - Documentation Files (Can Archive/Delete)
These are old status reports and guides that are no longer needed:

```
BROWSER_CACHE_FIX.md
CACHE_MIDDLEWARE_README.md
CACHE_SERVICE_README.md
COMPLETE_CACHE_CLEAR.md
CRITICAL_CACHE_ISSUE.md
CURRENT_STATUS.md
DATABASE_FIXED.md
DEPLOY_TO_RAILWAY.md
DEPLOYMENT_SUCCESS_SUMMARY.md
DEVELOPMENT_PLAN.md
ENHANCED_STREAMING_SERVICE_README.md
ENV_SETUP_GUIDE.md
ERROR_CHECK_RESULTS.md
FINAL_FIX_INSTRUCTIONS.md
FINAL_STATUS_REPORT.md
FIX_APPLIED.md
FIX_FRONTEND_CACHE.md
INFINITE_LOOP_FIXES.md
ISSUE_FOUND.md
MOVIE_NOT_FOUND_FIX.md
OPTIMIZATION_SUMMARY.md
PENDING_TASKS_REPORT.md
PROJECT_STATUS.md
PROMETHEUS_METRICS_README.md
PUSH_CHANGES.md
QUICK_FIX_GUIDE.md
READY_TO_START.md
SOFT_LAUNCH_CHECKLIST.md
STARTUP_CHECKLIST.md
STREAMING_FIX.md
TASK_2_IMPLEMENTATION_SUMMARY.md
TEST_WATCH_HISTORY.md
TROUBLESHOOTING.md
UI_IMPLEMENTATION_SUMMARY.md
UPDATE_CORS.md
VIDEO_PLAYER_GUIDE.md
VIDKING_IMPLEMENTATION_SUMMARY.md
VIDKING_QUICK_START.md
WATCH_HISTORY_COMPLETION_SUMMARY.md
```

### Root Directory - Test/Debug Scripts
```
check-database-movies.js
check-for-errors.js
check-status.sh
clear-cache.sh
debug-streaming.js
fix-database.js
populate-database.js
test-api.sh
test-auth.js
test-cache-middleware.js
test-cache-service.js
test-enhanced-streaming-fallback-only.js
test-enhanced-streaming-fallback.js
test-enhanced-streaming.js
test-mongodb-atlas.js
test-movie-context.js
test-prometheus-metrics.js
test-rate-limits.js
test-site-functionality.js
test-tmdb-connection.js
test-video-player-manual.js
test-video-player.js
test-vidking-service.js
```

### Root Directory - Shell Scripts (Old Workflows)
```
restart-frontend.sh
restart-servers.sh
start-all.sh
start-app.sh
stop-all.sh
```

### Root Directory - Log Files
```
backend.log
frontend.log
```

### Root Directory - Duplicate/Unused
```
.env.save
env.example (keep this one, delete .env.save)
```

## ✅ Files to Keep

### Essential Documentation
- README.md
- SETUP_GUIDE.md
- START_APP.md
- DEPLOY_VERCEL_RENDER.md

### Essential Config
- .env
- .gitignore
- package.json
- package-lock.json

### Essential Code
- client/ (entire folder)
- server/ (entire folder)
- node_modules/ (managed by npm)

## 🎯 Recommendation

**Option 1: Archive** (Safer)
Create an `archive/` folder and move old docs there

**Option 2: Delete** (Cleaner)
Just delete them - they're in git history if needed

## Next Steps

1. Review this list
2. Choose archive or delete
3. I'll execute the cleanup
