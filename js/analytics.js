/**
 * Behavioral Analytics & Telemetry Engine for Rangoli Utsav
 * Tracks Self-Determination Theory metrics (Autonomy, Competence, Flow),
 * cascade satisfaction, level bottlenecks, and ethical ad engagement.
 * Includes real-time Churn Risk Mitigation to support struggling players gracefully.
 */

class AnalyticsEngine {
    constructor() {
        this.sessionStart = Date.now();
        this.eventLog = [];
        this.levelStartTime = null;
        this.consecutiveFails = {};
        this.maxLoggedEvents = 200;
    }

    logEvent(eventName, payload = {}) {
        const event = {
            eventName,
            timestamp: Date.now(),
            timeSinceSessionStart: Math.floor((Date.now() - this.sessionStart) / 1000),
            payload
        };

        this.eventLog.push(event);
        if (this.eventLog.length > this.maxLoggedEvents) {
            this.eventLog.shift();
        }

        // Output to dev console in clean badge style
        console.log(`%c[Analytics] ${eventName}`, 'color: #D4AF37; font-weight: bold;', payload);
        return event;
    }

    onLevelStart(levelId) {
        this.levelStartTime = Date.now();
        this.logEvent('level_start', {
            levelId,
            consecutiveFailsBefore: this.consecutiveFails[levelId] || 0
        });
    }

    onLevelComplete(levelId, stars, score, movesRemaining) {
        const durationSec = this.levelStartTime ? Math.floor((Date.now() - this.levelStartTime) / 1000) : 0;
        this.consecutiveFails[levelId] = 0; // reset fail counter

        this.logEvent('level_complete', {
            levelId,
            stars,
            score,
            movesRemaining,
            durationSec,
            flowSatisfaction: movesRemaining >= 5 ? 'mastery' : 'tight_win'
        });
    }

    onLevelFail(levelId, remainingObjectives, score) {
        const durationSec = this.levelStartTime ? Math.floor((Date.now() - this.levelStartTime) / 1000) : 0;
        this.consecutiveFails[levelId] = (this.consecutiveFails[levelId] || 0) + 1;

        const failCount = this.consecutiveFails[levelId];
        const isChurnRisk = failCount >= 2;

        this.logEvent('level_fail', {
            levelId,
            failCount,
            score,
            remainingObjectives,
            durationSec,
            isChurnRisk
        });

        if (isChurnRisk) {
            this.logEvent('churn_risk_flagged', {
                levelId,
                failCount,
                mitigationRecommendation: 'offer_free_shagun_booster'
            });
        }

        return { isChurnRisk, failCount };
    }

    onCascadeStreak(levelId, depth) {
        if (depth >= 3) {
            this.logEvent('cascade_satisfaction', {
                levelId,
                depth,
                praiseLevel: depth >= 5 ? 'Adbhut' : (depth >= 4 ? 'Shandaar' : 'Sundar')
            });
        }
    }

    onSpecialCreated(specialType, levelId) {
        this.logEvent('special_gem_created', {
            specialType,
            levelId
        });
    }

    onRewardedAdWatched(placement, rewardGranted) {
        this.logEvent('rewarded_ad_completed', {
            placement, // 'out_of_moves', 'daily_wheel', 'courtyard_shagun'
            rewardGranted,
            isVoluntary: true
        });
    }

    onCourtyardRenovated(itemId, totalStars) {
        this.logEvent('courtyard_renovated', {
            itemId,
            totalStars
        });
    }

    getExportableLogs() {
        return JSON.stringify(this.eventLog, null, 2);
    }
}

window.AnalyticsEngine = new AnalyticsEngine();
