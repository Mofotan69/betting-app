"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_fetch_1 = require("node-fetch");
var app_1 = require("firebase/app");
var firestore_1 = require("firebase/firestore");
// =========================
// FIREBASE CONFIG
// =========================
var firebaseConfig = {
    apiKey: "AIzaSyBI0TZHDNZfMM2QVUOwkYhlmhMcxQ6PuV8",
    authDomain: "nba-playoffs-550b5.firebaseapp.com",
    projectId: "nba-playoffs-550b5",
};
var app = (0, app_1.initializeApp)(firebaseConfig);
var db = (0, firestore_1.getFirestore)(app);
// =========================
// STATUS MAPPING
// =========================
var mapStatus = function (status) {
    if (status === "Final")
        return "finished";
    if (status === "In Progress")
        return "live";
    if (status === "Halftime")
        return "live";
    return "upcoming";
};
// =========================
// MAIN SYNC FUNCTION
// =========================
function syncNBA() {
    return __awaiter(this, void 0, void 0, function () {
        var today, past, future, startDate, endDate, res, data, games, _i, games_1, g, gameId, status_1, homeScore, awayScore, winner, gameDoc, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    console.log("Fetching NBA games...");
                    today = new Date();
                    past = new Date();
                    future = new Date();
                    past.setDate(today.getDate() - 3); // recent
                    future.setDate(today.getDate() + 3); // upcoming
                    startDate = past.toISOString().split("T")[0];
                    endDate = future.toISOString().split("T")[0];
                    return [4 /*yield*/, (0, node_fetch_1.default)("https://api.balldontlie.io/v1/games?start_date=".concat(startDate, "&end_date=").concat(endDate), {
                            headers: {
                                Authorization: "060d2a7e-0720-4cfa-b47b-ed4f9ebc84b8"
                            }
                        })];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = (_a.sent());
                    // 🔍 Defensive check
                    if (!data || !Array.isArray(data.data)) {
                        console.error("Invalid API response:", data);
                        return [2 /*return*/];
                    }
                    games = data.data;
                    console.log("Found ".concat(games.length, " games"));
                    _i = 0, games_1 = games;
                    _a.label = 3;
                case 3:
                    if (!(_i < games_1.length)) return [3 /*break*/, 6];
                    g = games_1[_i];
                    gameId = g.id.toString();
                    status_1 = mapStatus(g.status);
                    homeScore = g.home_team_score || 0;
                    awayScore = g.visitor_team_score || 0;
                    winner = status_1 === "finished"
                        ? homeScore > awayScore
                            ? g.home_team.abbreviation
                            : g.visitor_team.abbreviation
                        : null;
                    gameDoc = {
                        externalId: g.id,
                        teamA: g.home_team.abbreviation,
                        teamB: g.visitor_team.abbreviation,
                        startTime: g.date,
                        status: status_1,
                        scoreA: homeScore,
                        scoreB: awayScore,
                        winner: winner,
                        round: "Regular Season" // can upgrade later to playoffs
                    };
                    return [4 /*yield*/, (0, firestore_1.setDoc)((0, firestore_1.doc)(db, "games", gameId), gameDoc, { merge: true })];
                case 4:
                    _a.sent();
                    console.log("".concat(gameDoc.teamA, " vs ").concat(gameDoc.teamB, " | ").concat(status_1, " | ").concat(homeScore, "-").concat(awayScore));
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    console.log("✅ Sync complete");
                    return [3 /*break*/, 8];
                case 7:
                    err_1 = _a.sent();
                    console.error("❌ Sync failed:", err_1);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// =========================
// RUN
// =========================
syncNBA();
