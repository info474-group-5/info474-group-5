// // Viz_RQ2_RanksSlams.js
// // Visualization for RQ2: ATP/WTA Year-end Rankings and Grand Slam Wins
// (function () {
//   const Viz = {
//     currentGender: "men",  // toggle between "men" and "women"
//     menTable: null,
//     womenTable: null,

//     // Players for each gender
//     menPlayers: ["Roger Federer", "Rafael Nadal", "Novak Djokovic"],
//     womenPlayers: ["Serena Williams", "Iga Swiatek", "Justine Henin"],

//     colors: {},
//     // Bigger right margin to make room for the legend panel
//     margin: { top: 60, right: 150, bottom: 60, left: 60 },
//     chartW: 0,
//     chartH: 0,
//     yearMin: null,
//     yearMax: null,
//     rankMin: null,
//     rankMax: null,
//     points: [],
//     initialized: false,
//     RANK_CUTOFF: 20,
//     highlightedPlayer: null,

//     ensureInit(p) {
//       if (this.initialized) return;
//       this.chartW = p.width - this.margin.left - this.margin.right;
//       this.chartH = p.height - this.margin.top - this.margin.bottom;

//       // Colors for men (Big 3)
//       this.colors["Roger Federer"]  = p.color(2, 131, 131);
//       this.colors["Rafael Nadal"]   = p.color(44, 103, 230);
//       this.colors["Novak Djokovic"] = p.color(255, 228, 96);

//       // Colors for women
//       this.colors["Serena Williams"] = p.color(255, 105, 180);
//       this.colors["Iga Swiatek"]     = p.color(147, 51, 234);
//       this.colors["Justine Henin"]   = p.color(34, 197, 94);

//       // Load both CSV files
//       if (!this.menTable) {
//         p.loadTable(
//           "data/processed/rankings_slams.csv",
//           "csv",
//           "header",
//           (t) => {
//             this.menTable = t;
//             console.log("Men's data loaded:", t.getRowCount(), "rows");
//             this.computeRanges();
//           },
//           (err) => {
//             console.error("Error loading men's data:", err);
//           }
//         );
//       }

//       if (!this.womenTable) {
//         p.loadTable(
//           "data/processed/rankings_slams_WTA.csv",
//           "csv",
//           "header",
//           (t) => {
//             this.womenTable = t;
//             console.log("Women's data loaded:", t.getRowCount(), "rows");
//             this.computeRanges();
//           },
//           (err) => {
//             console.error("Error loading women's data:", err);
//             console.error("Check file path: data/processed/ranks_slams_WTA.csv");
//           }
//         );
//       }

//       this.initialized = true;
//     },

//     getCurrentData() {
//       return {
//         table: this.currentGender === "men" ? this.menTable : this.womenTable,
//         players: this.currentGender === "men" ? this.menPlayers : this.womenPlayers
//       };
//     },

//     computeRanges() {
//       const { table } = this.getCurrentData();
//       if (!table || table.getRowCount() === 0) return;

//       const years = [];
//       for (let r = 0; r < table.getRowCount(); r++) {
//         const yearVal = table.getString(r, "year");
//         if (yearVal) years.push(parseInt(yearVal));
//       }

//       if (years.length > 0) {
//         this.yearMin = Math.min(...years);
//         this.yearMax = Math.max(...years);
//       }

//       this.rankMin = 1;
//       this.rankMax = this.RANK_CUTOFF;
//     },

//     draw(p, manager, ai, progress) {
//       this.ensureInit(p);

//       const { table } = this.getCurrentData();

//       if (!this.menTable) {
//         p.background(240);
//         p.fill(80);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.noStroke();
//         p.text("Loading men's data...", p.width / 2, p.height / 2);
//         return;
//       }

//       if (!this.womenTable) {
//         p.background(240);
//         p.fill(80);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.noStroke();
//         p.text("Loading women's data...", p.width / 2, p.height / 2);
//         console.log("Women's table not loaded yet");
//         return;
//       }

//       if (!table || this.yearMin === null) {
//         p.background(240);
//         p.fill(80);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.noStroke();
//         const gender = this.currentGender === "men" ? "Men's" : "Women's";
//         p.text(`${gender} data not ready...`, p.width / 2, p.height / 2);
//         console.log(`Current gender: ${this.currentGender}, Table rows: ${table ? table.getRowCount() : 'null'}`);
//         return;
//       }

//       p.background(240);
//       this.points = [];

//       this.drawAxes(p);

//       const { players } = this.getCurrentData();
//       for (let name of players) {
//         this.drawPlayerLine(p, name);
//       }

//       this.drawLegendAndToggle(p);
//       this.drawTooltip(p);
//     },

//     drawAxes(p) {
//       p.push();
//       p.translate(this.margin.left, this.margin.top);

//       p.stroke(200);
//       p.strokeWeight(1);

//       // x-axis
//       p.stroke(100);
//       p.line(0, this.chartH, this.chartW, this.chartH);

//       for (let y = this.yearMin; y <= this.yearMax; y += 2) {
//         let x = p.map(y, this.yearMin, this.yearMax, 0, this.chartW);
//         p.stroke(100);
//         p.line(x, this.chartH, x, this.chartH + 5);

//         p.textSize(10);
//         p.noStroke();
//         p.fill(80);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.text(y, x, this.chartH + 20);

//         p.stroke(220);
//         p.line(x, 0, x, this.chartH);
//       }

//       // y-axis
//       p.stroke(100);
//       p.line(0, 0, 0, this.chartH);
//       p.textAlign(p.RIGHT, p.CENTER);

//       for (let r = this.rankMin; r <= this.rankMax; r += 5) {
//         let y = p.map(r, this.rankMin, this.rankMax, 0, this.chartH);
//         p.stroke(100);
//         p.line(-5, y, 0, y);

//         p.noStroke();
//         p.textSize(10);
//         p.fill(80);
//         p.text(r, -10, y);

//         p.stroke(220);
//         p.line(0, y, this.chartW, y);
//       }

//       // Axis labels
//       p.noStroke();
//       p.textAlign(p.CENTER);
//       p.textSize(12);
//       p.fill(60);
//       p.text("Year", this.chartW / 2, this.chartH + 45);

//       p.push();
//       p.translate(-50, this.chartH / 2);
//       p.rotate(-p.HALF_PI);
//       const axisLabel = this.currentGender === "men" ? 
//         "Year-end ATP Ranking (lower is better)" : 
//         "Year-end WTA Ranking (lower is better)";
//       p.text(axisLabel, 0, 0);
//       p.pop();

//       // Title
//       p.textSize(16);
//       p.fill(40);
//       p.textStyle(p.BOLD); 

//       const titleLabel = this.currentGender === "men" ? 
//         "Big 3 ATP Year-end Rankings and Grand Slam Wins" :
//         "WTA Year-end Rankings and Grand Slam Wins";
//       p.text(titleLabel, this.chartW / 2, -30);

//       p.pop();
//     },

//     drawPlayerLine(p, playerName) {
//       const { table } = this.getCurrentData();

//       const rows = [];
//       for (let r = 0; r < table.getRowCount(); r++) {
//         if (table.getString(r, "player_name") === playerName) {
//           rows.push(table.getRow(r));
//         }
//       }

//       rows.sort((a, b) => parseInt(a.get("year")) - parseInt(b.get("year")));

//       const pts = [];
//       for (let row of rows) {
//         const year = parseInt(row.get("year"));
//         const rankStr = row.get("rank");
//         const trueRank = parseInt(rankStr);
//         if (Number.isNaN(trueRank)) continue;

//         const slamsStr = row.get("slam_wins");
//         const slams = slamsStr === "" ? 0 : parseInt(slamsStr);
//         const slamNames = row.get("slam_names") || "";

//         const x = p.map(year, this.yearMin, this.yearMax, 0, this.chartW);

//         const isClipped = trueRank > this.rankMax;
//         const rankForPlot = isClipped ? this.rankMax : trueRank;
//         const y = p.map(rankForPlot, this.rankMin, this.rankMax, 0, this.chartH);

//         pts.push({
//           x, y, year,
//           rank: trueRank,
//           slams,
//           slamNames,
//           player: playerName,
//           isClipped
//         });
//       }

//       p.push();
//       p.translate(this.margin.left, this.margin.top);

//       const isDimmed = this.highlightedPlayer && this.highlightedPlayer !== playerName;
//       const c = this.colors[playerName];

//       // Ranking line
//       if (isDimmed) {
//         p.stroke(c.levels[0], c.levels[1], c.levels[2], 80);
//         p.strokeWeight(1);
//       } else {
//         p.stroke(c);
//         p.strokeWeight(2.5);
//       }

//       p.noFill();
//       p.beginShape();
//       for (let pt of pts) {
//         p.vertex(pt.x, pt.y);
//       }
//       p.endShape();

//       // Draw points
//       for (let pt of pts) {
//         const baseRadius = pt.slams > 0 ? 5 : 2;
//         const extra = pt.slams > 0 ? Math.min(pt.slams, 3) * 1.5 : 0;
//         const r = baseRadius + extra;

//         if (pt.isClipped) {
//           const bottomY = this.chartH;
//           const triSize = 6;
//           p.noStroke();
//           p.fill(isDimmed ? p.color(c.levels[0], c.levels[1], c.levels[2], 100) : c);
//           p.triangle(
//             pt.x, bottomY + triSize,
//             pt.x - triSize / 2, bottomY,
//             pt.x + triSize / 2, bottomY
//           );
//         } else if (pt.slams > 0) {
//           if (!isDimmed) {
//             p.noStroke();
//             p.fill(c.levels[0], c.levels[1], c.levels[2], 60);
//             p.ellipse(pt.x, pt.y, (r + 4) * 2, (r + 4) * 2);
//           }

//           p.stroke(255);
//           p.strokeWeight(2);
//           p.fill(isDimmed ? p.color(c.levels[0], c.levels[1], c.levels[2], 120) : c);
//           p.ellipse(pt.x, pt.y, r * 2, r * 2);
//         } else {
//           p.noStroke();
//           p.fill(isDimmed ? 
//             p.color(c.levels[0], c.levels[1], c.levels[2], 60) :
//             p.color(c.levels[0], c.levels[1], c.levels[2], 180));
//           p.ellipse(pt.x, pt.y, r * 2, r * 2);
//         }

//         this.points.push({
//           ...pt,
//           screenX: pt.x + this.margin.left,
//           screenY: pt.y + this.margin.top,
//           radius: r
//         });
//       }

//       p.pop();
//     },

//     // Legend + gender toggle fully inside the right margin
//     drawLegendAndToggle(p) {
//       p.push();

//       const panelW = 130;
//       // Anchor legend into the right margin area
//       const x0 = p.width - this.margin.right + 15;
//       const y0 = this.margin.top;

//       const { players } = this.getCurrentData();

//       // Toggle button
//       const toggleW = panelW;
//       const toggleH = 30;
//       const toggleX = x0;
//       const toggleY = y0 + 5;

//       const isToggleHovering =
//         p.mouseX > toggleX && p.mouseX < toggleX + toggleW &&
//         p.mouseY > toggleY && p.mouseY < toggleY + toggleH;

//       if (this.currentGender === "men") {
//         p.fill(isToggleHovering ? p.color(44, 103, 230) : p.color(70, 130, 240));
//       } else {
//         p.fill(isToggleHovering ? p.color(255, 105, 180) : p.color(255, 130, 200));
//       }
//       p.noStroke();
//       p.rect(toggleX, toggleY, toggleW, toggleH, 4);

//       p.fill(255);
//       p.textSize(11);
//       p.textAlign(p.CENTER, p.CENTER);
//       const toggleLabel = this.currentGender === "men" ? "MEN'S ATP" : "WOMEN'S WTA";
//       p.text(toggleLabel, toggleX + toggleW / 2, toggleY + toggleH / 2);

//       // Instruction text
//       p.fill(120);
//       p.textSize(11);
//       p.text("Click to switch", toggleX + toggleW / 2, toggleY + toggleH + 12);

//       // Legend
//       const legendStartY = toggleY + toggleH + 40;
//       p.textAlign(p.LEFT, p.CENTER);
//       p.textSize(11);
//       p.noStroke();
//       p.fill(60);
//       p.text("Players (click to highlight)", x0, legendStartY);

//       let i = 1;
//       for (let name of players) {
//         const yy = legendStartY + i * 22;
//         const isHighlighted = this.highlightedPlayer === name;
//         const isClickable =
//           p.mouseX > x0 - 10 && p.mouseX < x0 + panelW &&
//           p.mouseY > yy - 10 && p.mouseY < yy + 10;

//         if (isClickable) {
//           p.fill(230);
//           p.noStroke();
//           p.rect(x0 - 10, yy - 10, panelW, 20, 3);
//         }

//         p.fill(this.colors[name]);
//         p.ellipse(x0, yy, 10, 10);

//         p.fill(isHighlighted ? 40 : 80);
//         p.textSize(11);
//         p.text(name, x0 + 12, yy);

//         if (isHighlighted) {
//           p.fill(40);
//           p.textSize(9);
//           p.text("★", x0 + panelW - 15, yy);
//         }

//         i++;
//       }

//       const infoY = legendStartY + i * 22 + 10;
//       p.textSize(10);
//       p.fill(100);
//       p.text("● = Slam year", x0, infoY);
//       p.text("▼ = Rank > 20", x0, infoY + 15);

//       if (this.highlightedPlayer) {
//         const resetY = infoY + 40;
//         const resetW = panelW - 20;
//         const resetH = 22;
//         const resetX = x0;

//         const isHovering =
//           p.mouseX > resetX && p.mouseX < resetX + resetW &&
//           p.mouseY > resetY && p.mouseY < resetY + resetH;

//         p.fill(isHovering ? 180 : 200);
//         p.stroke(140);
//         p.strokeWeight(1);
//         p.rect(resetX, resetY, resetW, resetH, 3);

//         p.noStroke();
//         p.fill(60);
//         p.textSize(10);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.text("Show All", resetX + resetW / 2, resetY + resetH / 2);
//       }

//       p.pop();
//     },

//     drawTooltip(p) {
//       let hovered = null;
//       for (let pt of this.points) {
//         const d = p.dist(p.mouseX, p.mouseY, pt.screenX, pt.screenY);
//         if (d <= pt.radius + 6) {
//           hovered = pt;
//           break;
//         }
//       }
//       if (!hovered) return;

//       const lines = [];
//       lines.push(hovered.player);
//       lines.push("Year: " + hovered.year);

//       let rankLine = "Rank: " + hovered.rank;
//       if (hovered.isClipped) {
//         rankLine += " (worse than #20)";
//       }
//       lines.push(rankLine);

//       if (hovered.slams > 0) {
//         lines.push("Slams: " + hovered.slams);
//         if (hovered.slamNames) {
//           lines.push(hovered.slamNames);
//         }
//       } else {
//         lines.push("No Slams this year");
//       }

//       const padding = 8;
//       p.textSize(10);
//       let w = 0;
//       for (let t of lines) {
//         w = Math.max(w, p.textWidth(t));
//       }
//       const h = lines.length * 15;

//       let x = hovered.screenX + 15;
//       let y = hovered.screenY - h - 15;
//       if (x + w + padding * 2 > p.width) x = p.width - w - padding * 2 - 5;
//       if (y < 0) y = hovered.screenY + 15;

//       p.fill(255);
//       p.stroke(150);
//       p.strokeWeight(1);
//       p.rect(x, y, w + padding * 2, h + padding * 2, 4);

//       p.noStroke();
//       p.fill(40);
//       p.textAlign(p.LEFT, p.TOP);
//       let ty = y + padding;
//       for (let i = 0; i < lines.length; i++) {
//         if (i === 0) {
//           p.textStyle(p.BOLD);
//         } else {
//           p.textStyle(p.NORMAL);
//         }
//         p.text(lines[i], x + padding, ty);
//         ty += 15;
//       }
//     },

//     handleClick(p) {
//       const panelW = 130;
//       const x0 = p.width - this.margin.right + 15;
//       const y0 = this.margin.top;

//       // Toggle button
//       const toggleW = panelW;
//       const toggleH = 30;
//       const toggleX = x0;
//       const toggleY = y0 + 5;

//       if (p.mouseX > toggleX && p.mouseX < toggleX + toggleW &&
//           p.mouseY > toggleY && p.mouseY < toggleY + toggleH) {
//         this.currentGender = this.currentGender === "men" ? "women" : "men";
//         this.highlightedPlayer = null;
//         this.computeRanges();
//         return true;
//       }

//       const legendStartY = toggleY + toggleH + 40;
//       const { players } = this.getCurrentData();

//       // Legend clicks
//       for (let i = 0; i < players.length; i++) {
//         const name = players[i];
//         const yy = legendStartY + (i + 1) * 22;

//         if (p.mouseX > x0 - 10 && p.mouseX < x0 + panelW &&
//             p.mouseY > yy - 10 && p.mouseY < yy + 10) {
//           this.highlightedPlayer = (this.highlightedPlayer === name) ? null : name;
//           return true;
//         }
//       }

//       // Reset button
//       if (this.highlightedPlayer) {
//         const infoY = legendStartY + (players.length + 1) * 22 + 10;
//         const resetY = infoY + 40;
//         const resetX = x0;
//         const resetW = panelW - 20;
//         const resetH = 22;

//         if (p.mouseX > resetX && p.mouseX < resetX + resetW &&
//             p.mouseY > resetY && p.mouseY < resetY + resetH) {
//           this.highlightedPlayer = null;
//           return true;
//         }
//       }

//       return false;
//     }
//   };

//   window.Viz_RQ2_RanksSlams = Viz;
// })();



// // Viz_RQ2_RanksSlams.js
// // Visualization for RQ2: ATP/WTA Year-end Rankings and Grand Slam Wins
// (function () {
//   const Viz = {
//     currentGender: "men",  // toggle between "men" and "women"
//     menTable: null,
//     womenTable: null,

//     // Players for each gender
//     menPlayers: ["Roger Federer", "Rafael Nadal", "Novak Djokovic"],
//     womenPlayers: ["Serena Williams", "Iga Swiatek", "Justine Henin"],

//     colors: {},
//     // Slightly bigger top margin for title + instructions
//     margin: { top: 80, right: 150, bottom: 60, left: 60 },
//     //margin: { top: 100, right: 150, bottom: 60, left: 60 },
//     chartW: 0,
//     chartH: 0,
//     yearMin: null,
//     yearMax: null,
//     rankMin: null,
//     rankMax: null,
//     points: [],
//     initialized: false,
//     RANK_CUTOFF: 20,
//     highlightedPlayer: null,

//     ensureInit(p) {
//       if (this.initialized) return;
//       this.chartW = p.width - this.margin.left - this.margin.right;
//       //this.chartH = p.height - this.margin.top - this.margin.bottom;
//       this.chartH = (p.height - this.margin.top - this.margin.bottom) * 0.90;


//       // Colors for men (Big 3)
//       this.colors["Roger Federer"]  = p.color(2, 131, 131);
//       this.colors["Rafael Nadal"]   = p.color(44, 103, 230);
//       this.colors["Novak Djokovic"] = p.color(255, 228, 96);

//       // Colors for women
//       this.colors["Serena Williams"] = p.color(255, 105, 180);
//       this.colors["Iga Swiatek"]     = p.color(147, 51, 234);
//       this.colors["Justine Henin"]   = p.color(34, 197, 94);

//       // Load both CSV files
//       if (!this.menTable) {
//         p.loadTable(
//           "data/processed/rankings_slams.csv",
//           "csv",
//           "header",
//           (t) => {
//             this.menTable = t;
//             this.computeRanges();
//           },
//           (err) => {
//             console.error("Error loading men's data:", err);
//           }
//         );
//       }

//       if (!this.womenTable) {
//         p.loadTable(
//           "data/processed/rankings_slams_WTA.csv",
//           "csv",
//           "header",
//           (t) => {
//             this.womenTable = t;
//             this.computeRanges();
//           },
//           (err) => {
//             console.error("Error loading women's data:", err);
//             console.error("Check file path: data/processed/ranks_slams_WTA.csv");
//           }
//         );
//       }

//       this.initialized = true;
//     },

//     getCurrentData() {
//       return {
//         table: this.currentGender === "men" ? this.menTable : this.womenTable,
//         players: this.currentGender === "men" ? this.menPlayers : this.womenPlayers
//       };
//     },

//     computeRanges() {
//       const { table } = this.getCurrentData();
//       if (!table || table.getRowCount() === 0) return;

//       const years = [];
//       for (let r = 0; r < table.getRowCount(); r++) {
//         const yearVal = table.getString(r, "year");
//         if (yearVal) years.push(parseInt(yearVal));
//       }

//       if (years.length > 0) {
//         this.yearMin = Math.min(...years);
//         this.yearMax = Math.max(...years);
//       }

//       this.rankMin = 1;
//       this.rankMax = this.RANK_CUTOFF;
//     },

//     draw(p, manager, ai, progress) {
//       this.ensureInit(p);

//       const { table } = this.getCurrentData();

//       if (!this.menTable) {
//         p.background(240);
//         p.fill(80);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.noStroke();
//         p.text("Loading men's data...", p.width / 2, p.height / 2);
//         return;
//       }

//       if (!this.womenTable) {
//         p.background(240);
//         p.fill(80);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.noStroke();
//         p.text("Loading women's data...", p.width / 2, p.height / 2);
//         return;
//       }

//       if (!table || this.yearMin === null) {
//         p.background(240);
//         p.fill(80);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.noStroke();
//         const gender = this.currentGender === "men" ? "Men's" : "Women's";
//         p.text(`${gender} data not ready...`, p.width / 2, p.height / 2);
//         return;
//       }

//       p.background(240);
//       this.points = [];

//       this.drawAxes(p);

//       const { players } = this.getCurrentData();
//       for (let name of players) {
//         this.drawPlayerLine(p, name);
//       }

//       this.drawLegendAndToggle(p);
//       this.drawTooltip(p);
//     },

//     drawAxes(p) {
//       p.push();
//       p.translate(this.margin.left, this.margin.top);

//       p.stroke(200);
//       p.strokeWeight(1);

//       // x-axis
//       p.stroke(100);
//       p.line(0, this.chartH, this.chartW, this.chartH);

//       for (let y = this.yearMin; y <= this.yearMax; y += 2) {
//         let x = p.map(y, this.yearMin, this.yearMax, 0, this.chartW);
//         p.stroke(100);
//         p.line(x, this.chartH, x, this.chartH + 5);

//         p.textSize(10);
//         p.noStroke();
//         p.fill(80);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.text(y, x, this.chartH + 20);

//         p.stroke(220);
//         p.line(x, 0, x, this.chartH);
//       }

//       // y-axis
//       p.stroke(100);
//       p.line(0, 0, 0, this.chartH);
//       p.textAlign(p.RIGHT, p.CENTER);

//       for (let r = this.rankMin; r <= this.rankMax; r += 5) {
//         let y = p.map(r, this.rankMin, this.rankMax, 0, this.chartH);

//         // tick mark
//         p.stroke(100);
//         p.line(-5, y, 0, y);

//         p.noStroke();
//         p.textSize(10);
//         p.fill(80);

//         // emphasize rank 1 visually
//         if (r === 1) {
//           p.textStyle(p.BOLD);
//         } else {
//           p.textStyle(p.NORMAL);
//         }
//         p.text(r, -10, y);

//         // grid line
//         if (r === 1) {
//           p.stroke(150);
//         } else {
//           p.stroke(220);
//         }
//         p.line(0, y, this.chartW, y);
//       }

//       // Axis labels
//       p.noStroke();
//       p.textAlign(p.CENTER);
//       p.textSize(12);
//       p.fill(60);
//       p.textStyle(p.NORMAL);
//       p.text("Year", this.chartW / 2, this.chartH + 45);

//       p.push();
//       p.translate(-50, this.chartH / 2);
//       p.rotate(-p.HALF_PI);
//       const axisLabel = this.currentGender === "men" ? 
//         "Year-end ATP Ranking (lower is better)" : 
//         "Year-end WTA Ranking (lower is better)";
//       p.text(axisLabel, 0, 0);
//       p.pop();

//       // Title
//       p.textSize(16);
//       p.fill(40);
//       p.textStyle(p.BOLD); 

//       const titleLabel = this.currentGender === "men" ? 
//         "Big 3 ATP Year-end Rankings and Grand Slam Wins" :
//         "WTA Year-end Rankings and Grand Slam Wins";
//       p.text(titleLabel, this.chartW / 2, -35);

//       // Short instruction line under title
//       p.textSize(11);
//       p.fill(80);
//       p.textStyle(p.NORMAL);
//       p.text(
//         "Hover over points for season details.",
//         this.chartW / 2,
//         -17
//       );

//       p.pop();
//     },

//     drawPlayerLine(p, playerName) {
//       const { table } = this.getCurrentData();

//       const rows = [];
//       for (let r = 0; r < table.getRowCount(); r++) {
//         if (table.getString(r, "player_name") === playerName) {
//           rows.push(table.getRow(r));
//         }
//       }

//       rows.sort((a, b) => parseInt(a.get("year")) - parseInt(b.get("year")));

//       const pts = [];
//       for (let row of rows) {
//         const year = parseInt(row.get("year"));
//         const rankStr = row.get("rank");
//         const trueRank = parseInt(rankStr);
//         if (Number.isNaN(trueRank)) continue;

//         const slamsStr = row.get("slam_wins");
//         const slams = slamsStr === "" ? 0 : parseInt(slamsStr);
//         const slamNames = row.get("slam_names") || "";

//         const x = p.map(year, this.yearMin, this.yearMax, 0, this.chartW);

//         const isClipped = trueRank > this.rankMax;
//         const rankForPlot = isClipped ? this.rankMax : trueRank;
//         const y = p.map(rankForPlot, this.rankMin, this.rankMax, 0, this.chartH);

//         pts.push({
//           x, y, year,
//           rank: trueRank,
//           slams,
//           slamNames,
//           player: playerName,
//           isClipped
//         });
//       }

//       p.push();
//       p.translate(this.margin.left, this.margin.top);

//       const isDimmed = this.highlightedPlayer && this.highlightedPlayer !== playerName;
//       const c = this.colors[playerName];

//       // Ranking line
//       if (isDimmed) {
//         p.stroke(c.levels[0], c.levels[1], c.levels[2], 80);
//         p.strokeWeight(1);
//       } else {
//         p.stroke(c);
//         p.strokeWeight(2.5);
//       }

//       p.noFill();
//       p.beginShape();
//       for (let pt of pts) {
//         p.vertex(pt.x, pt.y);
//       }
//       p.endShape();

//       // Draw points
//       for (let pt of pts) {
//         // slightly larger for rank-1 non-Slam seasons
//         const baseRadius = pt.slams > 0 ? 5 : (pt.rank === 1 ? 3 : 2);
//         const extra = pt.slams > 0 ? Math.min(pt.slams, 3) * 1.5 : 0;
//         const r = baseRadius + extra;

//         if (pt.isClipped) {
//           const bottomY = this.chartH;
//           const triSize = 6;
//           p.noStroke();
//           p.fill(isDimmed ? p.color(c.levels[0], c.levels[1], c.levels[2], 100) : c);
//           p.triangle(
//             pt.x, bottomY + triSize,
//             pt.x - triSize / 2, bottomY,
//             pt.x + triSize / 2, bottomY
//           );
//         } else if (pt.slams > 0) {
//           if (!isDimmed) {
//             p.noStroke();
//             p.fill(c.levels[0], c.levels[1], c.levels[2], 60);
//             p.ellipse(pt.x, pt.y, (r + 4) * 2, (r + 4) * 2);
//           }

//           p.stroke(255);
//           p.strokeWeight(2);
//           p.fill(isDimmed ? p.color(c.levels[0], c.levels[1], c.levels[2], 120) : c);
//           p.ellipse(pt.x, pt.y, r * 2, r * 2);
//         } else {
//           p.noStroke();
//           p.fill(
//             isDimmed
//               ? p.color(c.levels[0], c.levels[1], c.levels[2], 60)
//               : p.color(c.levels[0], c.levels[1], c.levels[2], 180)
//           );
//           p.ellipse(pt.x, pt.y, r * 2, r * 2);
//         }

//         this.points.push({
//           ...pt,
//           screenX: pt.x + this.margin.left,
//           screenY: pt.y + this.margin.top,
//           radius: r
//         });
//       }

//       p.pop();
//     },

//     // Legend + gender toggle fully inside the right margin
//     drawLegendAndToggle(p) {
//       p.push();

//       const panelW = 130;
//       const x0 = p.width - this.margin.right + 15;
//       const y0 = this.margin.top;

//       const { players } = this.getCurrentData();

//       // Toggle button
//       const toggleW = panelW;
//       const toggleH = 30;
//       const toggleX = x0;
//       const toggleY = y0 + 5;

//       const isToggleHovering =
//         p.mouseX > toggleX && p.mouseX < toggleX + toggleW &&
//         p.mouseY > toggleY && p.mouseY < toggleY + toggleH;

//       if (this.currentGender === "men") {
//         p.fill(isToggleHovering ? p.color(44, 103, 230) : p.color(70, 130, 240));
//       } else {
//         p.fill(isToggleHovering ? p.color(255, 105, 180) : p.color(255, 130, 200));
//       }
//       p.noStroke();
//       p.rect(toggleX, toggleY, toggleW, toggleH, 4);

//       p.fill(255);
//       p.textSize(11);
//       p.textAlign(p.CENTER, p.CENTER);
//       const toggleLabel = this.currentGender === "men" ? "MEN'S ATP" : "WOMEN'S WTA";
//       p.text(toggleLabel, toggleX + toggleW / 2, toggleY + toggleH / 2);

//       // Instruction text
//       p.fill(120);
//       p.textSize(11);
//       p.text("Click to switch", toggleX + toggleW / 2, toggleY + toggleH + 12);

//       // Legend
//       const legendStartY = toggleY + toggleH + 40;
//       p.textAlign(p.LEFT, p.CENTER);
//       p.textSize(11);
//       p.noStroke();
//       p.fill(60);
//       p.text("Players (click to highlight)", x0, legendStartY);

//       let i = 1;
//       for (let name of players) {
//         const yy = legendStartY + i * 22;
//         const isHighlighted = this.highlightedPlayer === name;
//         const isClickable =
//           p.mouseX > x0 - 10 && p.mouseX < x0 + panelW &&
//           p.mouseY > yy - 10 && p.mouseY < yy + 10;

//         if (isClickable) {
//           p.fill(230);
//           p.noStroke();
//           p.rect(x0 - 10, yy - 10, panelW, 20, 3);
//         }

//         p.fill(this.colors[name]);
//         p.ellipse(x0, yy, 10, 10);

//         p.fill(isHighlighted ? 40 : 80);
//         p.textSize(11);
//         p.text(name, x0 + 12, yy);

//         if (isHighlighted) {
//           p.fill(40);
//           p.textSize(9);
//           p.text("★", x0 + panelW - 15, yy);
//         }

//         i++;
//       }

//       const infoY = legendStartY + i * 22 + 10;
//       p.textSize(10);
//       p.fill(100);
//       p.text("● = Slam year", x0, infoY);
//       p.text("▼ = Rank > 20", x0, infoY + 15);

//       if (this.highlightedPlayer) {
//         const resetY = infoY + 40;
//         const resetW = panelW - 20;
//         const resetH = 22;
//         const resetX = x0;

//         const isHovering =
//           p.mouseX > resetX && p.mouseX < resetX + resetW &&
//           p.mouseY > resetY && p.mouseY < resetY + resetH;

//         p.fill(isHovering ? 180 : 200);
//         p.stroke(140);
//         p.strokeWeight(1);
//         p.rect(resetX, resetY, resetW, resetH, 3);

//         p.noStroke();
//         p.fill(60);
//         p.textSize(10);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.text("Show All", resetX + resetW / 2, resetY + resetH / 2);
//       }

//       p.pop();
//     },

//     drawTooltip(p) {
//       let hovered = null;
//       for (let pt of this.points) {
//         const d = p.dist(p.mouseX, p.mouseY, pt.screenX, pt.screenY);
//         if (d <= pt.radius + 6) {
//           hovered = pt;
//           break;
//         }
//       }
//       if (!hovered) return;

//       const lines = [];
//       lines.push(hovered.player);
//       lines.push("Year: " + hovered.year);

//       let rankLine = "Rank: " + hovered.rank;
//       if (hovered.isClipped) {
//         rankLine += " (worse than #20)";
//       }
//       lines.push(rankLine);

//       if (hovered.slams > 0) {
//         lines.push("Slams: " + hovered.slams);
//         if (hovered.slamNames) {
//           lines.push(hovered.slamNames);
//         }
//       } else {
//         lines.push("No Slams this year");
//       }

//       const padding = 8;
//       p.textSize(10);
//       let w = 0;
//       for (let t of lines) {
//         w = Math.max(w, p.textWidth(t));
//       }
//       const h = lines.length * 15;

//       let x = hovered.screenX + 15;
//       let y = hovered.screenY - h - 15;
//       if (x + w + padding * 2 > p.width) x = p.width - w - padding * 2 - 5;
//       if (y < 0) y = hovered.screenY + 15;

//       p.fill(255);
//       p.stroke(150);
//       p.strokeWeight(1);
//       p.rect(x, y, w + padding * 2, h + padding * 2, 4);

//       p.noStroke();
//       p.fill(40);
//       p.textAlign(p.LEFT, p.TOP);
//       let ty = y + padding;
//       for (let i = 0; i < lines.length; i++) {
//         if (i === 0) {
//           p.textStyle(p.BOLD);
//         } else {
//           p.textStyle(p.NORMAL);
//         }
//         p.text(lines[i], x + padding, ty);
//         ty += 15;
//       }
//     },

//     handleClick(p) {
//       const panelW = 130;
//       const x0 = p.width - this.margin.right + 15;
//       const y0 = this.margin.top;

//       // Toggle button
//       const toggleW = panelW;
//       const toggleH = 30;
//       const toggleX = x0;
//       const toggleY = y0 + 5;

//       if (p.mouseX > toggleX && p.mouseX < toggleX + toggleW &&
//           p.mouseY > toggleY && p.mouseY < toggleY + toggleH) {
//         this.currentGender = this.currentGender === "men" ? "women" : "men";
//         this.highlightedPlayer = null;
//         this.computeRanges();
//         return true;
//       }

//       const legendStartY = toggleY + toggleH + 40;
//       const { players } = this.getCurrentData();

//       // Legend clicks
//       for (let i = 0; i < players.length; i++) {
//         const name = players[i];
//         const yy = legendStartY + (i + 1) * 22;

//         if (p.mouseX > x0 - 10 && p.mouseX < x0 + panelW &&
//             p.mouseY > yy - 10 && p.mouseY < yy + 10) {
//           this.highlightedPlayer = (this.highlightedPlayer === name) ? null : name;
//           return true;
//         }
//       }

//       // Reset button
//       if (this.highlightedPlayer) {
//         const infoY = legendStartY + (players.length + 1) * 22 + 10;
//         const resetY = infoY + 40;
//         const resetX = x0;
//         const resetW = panelW - 20;
//         const resetH = 22;

//         if (p.mouseX > resetX && p.mouseX < resetX + resetW &&
//             p.mouseY > resetY && p.mouseY < resetY + resetH) {
//           this.highlightedPlayer = null;
//           return true;
//         }
//       }

//       return false;
//     }
//   };

//   window.Viz_RQ2_RanksSlams = Viz;
// })();




// // Viz_RQ2_RanksSlams.js
// // Visualization for RQ2: ATP/WTA Year-end Rankings and Grand Slam Wins
// (function () {
//   const Viz = {
//     currentGender: "men",  // toggle between "men" and "women"
//     menTable: null,
//     womenTable: null,

//     // Players for each gender
//     menPlayers: ["Roger Federer", "Rafael Nadal", "Novak Djokovic"],
//     womenPlayers: ["Serena Williams", "Iga Swiatek", "Justine Henin"],

//     colors: {},
//     // Slightly bigger top margin for title + instructions
//     margin: { top: 80, right: 150, bottom: 60, left: 60 },
//     chartW: 0,
//     chartH: 0,
//     yearMin: null,
//     yearMax: null,
//     rankMin: null,
//     rankMax: null,
//     points: [],
//     initialized: false,
//     RANK_CUTOFF: 20,
//     highlightedPlayer: null,
//     chartOffsetY: 40, // move chart down while keeping title in place

//     ensureInit(p) {
//       if (this.initialized) return;
//       this.chartW = p.width - this.margin.left - this.margin.right;
//       this.chartH = (p.height - this.margin.top - this.margin.bottom) * 0.90;

//       // Colors for men (Big 3)
//       this.colors["Roger Federer"]  = p.color(2, 131, 131);
//       this.colors["Rafael Nadal"]   = p.color(44, 103, 230);
//       this.colors["Novak Djokovic"] = p.color(255, 228, 96);

//       // Colors for women
//       this.colors["Serena Williams"] = p.color(255, 105, 180);
//       this.colors["Iga Swiatek"]     = p.color(147, 51, 234);
//       this.colors["Justine Henin"]   = p.color(34, 197, 94);

//       // Load both CSV files
//       if (!this.menTable) {
//         p.loadTable(
//           "data/processed/rankings_slams.csv",
//           "csv",
//           "header",
//           (t) => {
//             this.menTable = t;
//             this.computeRanges();
//           },
//           (err) => {
//             console.error("Error loading men's data:", err);
//           }
//         );
//       }

//       if (!this.womenTable) {
//         p.loadTable(
//           "data/processed/rankings_slams_WTA.csv",
//           "csv",
//           "header",
//           (t) => {
//             this.womenTable = t;
//             this.computeRanges();
//           },
//           (err) => {
//             console.error("Error loading women's data:", err);
//             console.error("Check file path: data/processed/ranks_slams_WTA.csv");
//           }
//         );
//       }

//       this.initialized = true;
//     },

//     getCurrentData() {
//       return {
//         table: this.currentGender === "men" ? this.menTable : this.womenTable,
//         players: this.currentGender === "men" ? this.menPlayers : this.womenPlayers
//       };
//     },

//     computeRanges() {
//       const { table } = this.getCurrentData();
//       if (!table || table.getRowCount() === 0) return;

//       const years = [];
//       for (let r = 0; r < table.getRowCount(); r++) {
//         const yearVal = table.getString(r, "year");
//         if (yearVal) years.push(parseInt(yearVal));
//       }

//       if (years.length > 0) {
//         this.yearMin = Math.min(...years);
//         this.yearMax = Math.max(...years);
//       }

//       this.rankMin = 1;
//       this.rankMax = this.RANK_CUTOFF;
//     },

//     draw(p, manager, ai, progress) {
//       this.ensureInit(p);

//       const { table } = this.getCurrentData();

//       if (!this.menTable) {
//         p.background(240);
//         p.fill(80);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.noStroke();
//         p.text("Loading men's data...", p.width / 2, p.height / 2);
//         return;
//       }

//       if (!this.womenTable) {
//         p.background(240);
//         p.fill(80);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.noStroke();
//         p.text("Loading women's data...", p.width / 2, p.height / 2);
//         return;
//       }

//       if (!table || this.yearMin === null) {
//         p.background(240);
//         p.fill(80);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.noStroke();
//         const gender = this.currentGender === "men" ? "Men's" : "Women's";
//         p.text(`${gender} data not ready...`, p.width / 2, p.height / 2);
//         return;
//       }

//       p.background(240);
//       this.points = [];

//       this.drawAxes(p);

//       const { players } = this.getCurrentData();
//       for (let name of players) {
//         this.drawPlayerLine(p, name);
//       }

//       this.drawLegendAndToggle(p);
//       this.drawTooltip(p);
//     },

//     drawAxes(p) {
//       p.push();
//       // outer translation for title region
//       p.translate(this.margin.left, this.margin.top);

//       // Title (stays in place)
//       p.textSize(16);
//       p.fill(40);
//       p.textStyle(p.BOLD); 

//       const titleLabel = this.currentGender === "men" ? 
//         "Big 3 ATP Year-end Rankings and Grand Slam Wins" :
//         "WTA Year-end Rankings and Grand Slam Wins";
//       p.text(titleLabel, this.chartW / 2, -35);

//       // Short instruction line under title
//       p.textSize(11);
//       p.fill(80);
//       p.textStyle(p.NORMAL);
//       p.text(
//         "Hover over points for season details.",
//         this.chartW / 2,
//         -17
//       );

//       // NOW move down for the chart itself
//       p.translate(0, this.chartOffsetY);

//       p.stroke(200);
//       p.strokeWeight(1);

//       // x-axis
//       p.stroke(100);
//       p.line(0, this.chartH, this.chartW, this.chartH);

//       for (let y = this.yearMin; y <= this.yearMax; y += 2) {
//         let x = p.map(y, this.yearMin, this.yearMax, 0, this.chartW);
//         p.stroke(100);
//         p.line(x, this.chartH, x, this.chartH + 5);

//         p.textSize(10);
//         p.noStroke();
//         p.fill(80);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.text(y, x, this.chartH + 20);

//         p.stroke(220);
//         p.line(x, 0, x, this.chartH);
//       }

//       // y-axis
//       p.stroke(100);
//       p.line(0, 0, 0, this.chartH);
//       p.textAlign(p.RIGHT, p.CENTER);

//       for (let r = this.rankMin; r <= this.rankMax; r += 5) {
//         let y = p.map(r, this.rankMin, this.rankMax, 0, this.chartH);

//         // tick mark
//         p.stroke(100);
//         p.line(-5, y, 0, y);

//         p.noStroke();
//         p.textSize(10);
//         p.fill(80);

//         // emphasize rank 1 visually
//         if (r === 1) {
//           p.textStyle(p.BOLD);
//         } else {
//           p.textStyle(p.NORMAL);
//         }
//         p.text(r, -10, y);

//         // grid line
//         if (r === 1) {
//           p.stroke(150);
//         } else {
//           p.stroke(220);
//         }
//         p.line(0, y, this.chartW, y);
//       }

//       // Axis labels
//       p.noStroke();
//       p.textAlign(p.CENTER);
//       p.textSize(12);
//       p.fill(60);
//       p.textStyle(p.NORMAL);
//       p.text("Year", this.chartW / 2, this.chartH + 45);

//       p.push();
//       p.translate(-50, this.chartH / 2);
//       p.rotate(-p.HALF_PI);
//       const axisLabel = this.currentGender === "men" ? 
//         "Year-end ATP Ranking (lower is better)" : 
//         "Year-end WTA Ranking (lower is better)";
//       p.text(axisLabel, 0, 0);
//       p.pop();

//       p.pop();
//     },

//     drawPlayerLine(p, playerName) {
//       const { table } = this.getCurrentData();

//       const rows = [];
//       for (let r = 0; r < table.getRowCount(); r++) {
//         if (table.getString(r, "player_name") === playerName) {
//           rows.push(table.getRow(r));
//         }
//       }

//       rows.sort((a, b) => parseInt(a.get("year")) - parseInt(b.get("year")));

//       const pts = [];
//       for (let row of rows) {
//         const year = parseInt(row.get("year"));
//         const rankStr = row.get("rank");
//         const trueRank = parseInt(rankStr);
//         if (Number.isNaN(trueRank)) continue;

//         const slamsStr = row.get("slam_wins");
//         const slams = slamsStr === "" ? 0 : parseInt(slamsStr);
//         const slamNames = row.get("slam_names") || "";

//         const x = p.map(year, this.yearMin, this.yearMax, 0, this.chartW);

//         const isClipped = trueRank > this.rankMax;
//         const rankForPlot = isClipped ? this.rankMax : trueRank;
//         const y = p.map(rankForPlot, this.rankMin, this.rankMax, 0, this.chartH);

//         pts.push({
//           x, y, year,
//           rank: trueRank,
//           slams,
//           slamNames,
//           player: playerName,
//           isClipped
//         });
//       }

//       p.push();
//       // translate by margin + offset so chart is lower
//       p.translate(this.margin.left, this.margin.top + this.chartOffsetY);

//       const isDimmed = this.highlightedPlayer && this.highlightedPlayer !== playerName;
//       const c = this.colors[playerName];

//       // Ranking line
//       if (isDimmed) {
//         p.stroke(c.levels[0], c.levels[1], c.levels[2], 80);
//         p.strokeWeight(1);
//       } else {
//         p.stroke(c);
//         p.strokeWeight(2.5);
//       }

//       p.noFill();
//       p.beginShape();
//       for (let pt of pts) {
//         p.vertex(pt.x, pt.y);
//       }
//       p.endShape();

//       // Draw points
//       for (let pt of pts) {
//         // slightly larger for rank-1 non-Slam seasons
//         const baseRadius = pt.slams > 0 ? 5 : (pt.rank === 1 ? 3 : 2);
//         const extra = pt.slams > 0 ? Math.min(pt.slams, 3) * 1.5 : 0;
//         const r = baseRadius + extra;

//         if (pt.isClipped) {
//           const bottomY = this.chartH;
//           const triSize = 6;
//           p.noStroke();
//           p.fill(isDimmed ? p.color(c.levels[0], c.levels[1], c.levels[2], 100) : c);
//           p.triangle(
//             pt.x, bottomY + triSize,
//             pt.x - triSize / 2, bottomY,
//             pt.x + triSize / 2, bottomY
//           );
//         } else if (pt.slams > 0) {
//           if (!isDimmed) {
//             p.noStroke();
//             p.fill(c.levels[0], c.levels[1], c.levels[2], 60);
//             p.ellipse(pt.x, pt.y, (r + 4) * 2, (r + 4) * 2);
//           }

//           p.stroke(255);
//           p.strokeWeight(2);
//           p.fill(isDimmed ? p.color(c.levels[0], c.levels[1], c.levels[2], 120) : c);
//           p.ellipse(pt.x, pt.y, r * 2, r * 2);
//         } else {
//           p.noStroke();
//           p.fill(
//             isDimmed
//               ? p.color(c.levels[0], c.levels[1], c.levels[2], 60)
//               : p.color(c.levels[0], c.levels[1], c.levels[2], 180)
//           );
//           p.ellipse(pt.x, pt.y, r * 2, r * 2);
//         }

//         this.points.push({
//           ...pt,
//           screenX: pt.x + this.margin.left,
//           screenY: pt.y + this.margin.top + this.chartOffsetY,
//           radius: r
//         });
//       }

//       p.pop();
//     },

//     // Legend + gender toggle fully inside the right margin
//     drawLegendAndToggle(p) {
//       p.push();

//       const panelW = 130;
//       const x0 = p.width - this.margin.right + 15;
//       const y0 = this.margin.top;

//       const { players } = this.getCurrentData();

//       // Toggle button
//       const toggleW = panelW;
//       const toggleH = 30;
//       const toggleX = x0;
//       const toggleY = y0 + 5;

//       const isToggleHovering =
//         p.mouseX > toggleX && p.mouseX < toggleX + toggleW &&
//         p.mouseY > toggleY && p.mouseY < toggleY + toggleH;

//       if (this.currentGender === "men") {
//         p.fill(isToggleHovering ? p.color(44, 103, 230) : p.color(70, 130, 240));
//       } else {
//         p.fill(isToggleHovering ? p.color(255, 105, 180) : p.color(255, 130, 200));
//       }
//       p.noStroke();
//       p.rect(toggleX, toggleY, toggleW, toggleH, 4);

//       p.fill(255);
//       p.textSize(11);
//       p.textAlign(p.CENTER, p.CENTER);
//       const toggleLabel = this.currentGender === "men" ? "MEN'S ATP" : "WOMEN'S WTA";
//       p.text(toggleLabel, toggleX + toggleW / 2, toggleY + toggleH / 2);

//       // Instruction text
//       p.fill(120);
//       p.textSize(11);
//       p.text("Click to switch", toggleX + toggleW / 2, toggleY + toggleH + 12);

//       // Legend
//       const legendStartY = toggleY + toggleH + 40;
//       p.textAlign(p.LEFT, p.CENTER);
//       p.textSize(11);
//       p.noStroke();
//       p.fill(60);
//       p.text("Players (click to highlight)", x0, legendStartY);

//       let i = 1;
//       for (let name of players) {
//         const yy = legendStartY + i * 22;
//         const isHighlighted = this.highlightedPlayer === name;
//         const isClickable =
//           p.mouseX > x0 - 10 && p.mouseX < x0 + panelW &&
//           p.mouseY > yy - 10 && p.mouseY < yy + 10;

//         if (isClickable) {
//           p.fill(230);
//           p.noStroke();
//           p.rect(x0 - 10, yy - 10, panelW, 20, 3);
//         }

//         p.fill(this.colors[name]);
//         p.ellipse(x0, yy, 10, 10);

//         p.fill(isHighlighted ? 40 : 80);
//         p.textSize(11);
//         p.text(name, x0 + 12, yy);

//         if (isHighlighted) {
//           p.fill(40);
//           p.textSize(9);
//           p.text("★", x0 + panelW - 15, yy);
//         }

//         i++;
//       }

//       const infoY = legendStartY + i * 22 + 10;
//       p.textSize(10);
//       p.fill(100);
//       p.text("● = Slam year", x0, infoY);
//       p.text("▼ = Rank > 20", x0, infoY + 15);

//       if (this.highlightedPlayer) {
//         const resetY = infoY + 40;
//         const resetW = panelW - 20;
//         const resetH = 22;
//         const resetX = x0;

//         const isHovering =
//           p.mouseX > resetX && p.mouseX < resetX + resetW &&
//           p.mouseY > resetY && p.mouseY < resetY + resetH;

//         p.fill(isHovering ? 180 : 200);
//         p.stroke(140);
//         p.strokeWeight(1);
//         p.rect(resetX, resetY, resetW, resetH, 3);

//         p.noStroke();
//         p.fill(60);
//         p.textSize(10);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.text("Show All", resetX + resetW / 2, resetY + resetH / 2);
//       }

//       p.pop();
//     },

//     drawTooltip(p) {
//       let hovered = null;
//       for (let pt of this.points) {
//         const d = p.dist(p.mouseX, p.mouseY, pt.screenX, pt.screenY);
//         if (d <= pt.radius + 6) {
//           hovered = pt;
//           break;
//         }
//       }
//       if (!hovered) return;

//       const lines = [];
//       lines.push(hovered.player);
//       lines.push("Year: " + hovered.year);

//       let rankLine = "Rank: " + hovered.rank;
//       if (hovered.isClipped) {
//         rankLine += " (worse than #20)";
//       }
//       lines.push(rankLine);

//       if (hovered.slams > 0) {
//         lines.push("Slams: " + hovered.slams);
//         if (hovered.slamNames) {
//           lines.push(hovered.slamNames);
//         }
//       } else {
//         lines.push("No Slams this year");
//       }

//       const padding = 8;
//       p.textSize(10);
//       let w = 0;
//       for (let t of lines) {
//         w = Math.max(w, p.textWidth(t));
//       }
//       const h = lines.length * 15;

//       let x = hovered.screenX + 15;
//       let y = hovered.screenY - h - 15;
//       if (x + w + padding * 2 > p.width) x = p.width - w - padding * 2 - 5;
//       if (y < 0) y = hovered.screenY + 15;

//       p.fill(255);
//       p.stroke(150);
//       p.strokeWeight(1);
//       p.rect(x, y, w + padding * 2, h + padding * 2, 4);

//       p.noStroke();
//       p.fill(40);
//       p.textAlign(p.LEFT, p.TOP);
//       let ty = y + padding;
//       for (let i = 0; i < lines.length; i++) {
//         if (i === 0) {
//           p.textStyle(p.BOLD);
//         } else {
//           p.textStyle(p.NORMAL);
//         }
//         p.text(lines[i], x + padding, ty);
//         ty += 15;
//       }
//     },

//     handleClick(p) {
//       const panelW = 130;
//       const x0 = p.width - this.margin.right + 15;
//       const y0 = this.margin.top;

//       // Toggle button
//       const toggleW = panelW;
//       const toggleH = 30;
//       const toggleX = x0;
//       const toggleY = y0 + 5;

//       if (p.mouseX > toggleX && p.mouseX < toggleX + toggleW &&
//           p.mouseY > toggleY && p.mouseY < toggleY + toggleH) {
//         this.currentGender = this.currentGender === "men" ? "women" : "men";
//         this.highlightedPlayer = null;
//         this.computeRanges();
//         return true;
//       }

//       const legendStartY = toggleY + toggleH + 40;
//       const { players } = this.getCurrentData();

//       // Legend clicks
//       for (let i = 0; i < players.length; i++) {
//         const name = players[i];
//         const yy = legendStartY + (i + 1) * 22;

//         if (p.mouseX > x0 - 10 && p.mouseX < x0 + panelW &&
//             p.mouseY > yy - 10 && p.mouseY < yy + 10) {
//           this.highlightedPlayer = (this.highlightedPlayer === name) ? null : name;
//           return true;
//         }
//       }

//       // Reset button
//       if (this.highlightedPlayer) {
//         const infoY = legendStartY + (players.length + 1) * 22 + 10;
//         const resetY = infoY + 40;
//         const resetX = x0;
//         const resetW = panelW - 20;
//         const resetH = 22;

//         if (p.mouseX > resetX && p.mouseX < resetX + resetW &&
//             p.mouseY > resetY && p.mouseY < resetY + resetH) {
//           this.highlightedPlayer = null;
//           return true;
//         }
//       }

//       return false;
//     }
//   };

//   window.Viz_RQ2_RanksSlams = Viz;
// })();






// // Viz_RQ2_RanksSlams.js
// // Visualization for RQ2: ATP/WTA Year-end Rankings and Grand Slam Wins
// (function () {
//   const Viz = {
//     currentGender: "men",  // toggle between "men" and "women"
//     menTable: null,
//     womenTable: null,

//     // Players for each gender
//     menPlayers: ["Roger Federer", "Rafael Nadal", "Novak Djokovic"],
//     womenPlayers: ["Serena Williams", "Iga Swiatek", "Justine Henin"],

//     colors: {},
//     // Slightly bigger top margin for title + instructions
//     margin: { top: 80, right: 150, bottom: 60, left: 60 },
//     chartW: 0,
//     chartH: 0,
//     chartOffsetY: 20,   // push chart down a bit under the title
//     yearMin: null,
//     yearMax: null,
//     rankMin: null,
//     rankMax: null,
//     points: [],
//     initialized: false,
//     RANK_CUTOFF: 20,
//     highlightedPlayer: null,

//     ensureInit(p) {
//       if (this.initialized) return;
//       this.chartW = p.width - this.margin.left - this.margin.right;
//       this.chartH = (p.height - this.margin.top - this.margin.bottom) * 0.90;

//       // Colors for men (Big 3)
//       this.colors["Roger Federer"] = p.color(2, 131, 131);
//       this.colors["Rafael Nadal"] = p.color(44, 103, 230);
//       this.colors["Novak Djokovic"] = p.color(255, 228, 96);

//       // Colors for women
//       this.colors["Serena Williams"] = p.color(255, 105, 180);
//       this.colors["Iga Swiatek"] = p.color(147, 51, 234);
//       this.colors["Justine Henin"] = p.color(34, 197, 94);

//       // Load both CSV files
//       if (!this.menTable) {
//         p.loadTable(
//           "data/processed/rankings_slams.csv",
//           "csv",
//           "header",
//           (t) => {
//             this.menTable = t;
//             this.computeRanges();
//           },
//           (err) => {
//             console.error("Error loading men's data:", err);
//           }
//         );
//       }

//       if (!this.womenTable) {
//         p.loadTable(
//           "data/processed/rankings_slams_WTA.csv",
//           "csv",
//           "header",
//           (t) => {
//             this.womenTable = t;
//             this.computeRanges();
//           },
//           (err) => {
//             console.error("Error loading women's data:", err);
//             console.error("Check file path: data/processed/ranks_slams_WTA.csv");
//           }
//         );
//       }

//       this.initialized = true;
//     },

//     getCurrentData() {
//       return {
//         table: this.currentGender === "men" ? this.menTable : this.womenTable,
//         players: this.currentGender === "men" ? this.menPlayers : this.womenPlayers
//       };
//     },

//     computeRanges() {
//       const { table } = this.getCurrentData();
//       if (!table || table.getRowCount() === 0) return;

//       const years = [];
//       for (let r = 0; r < table.getRowCount(); r++) {
//         const yearVal = table.getString(r, "year");
//         if (yearVal) years.push(parseInt(yearVal));
//       }

//       if (years.length > 0) {
//         this.yearMin = Math.min(...years);
//         this.yearMax = Math.max(...years);
//       }

//       this.rankMin = 1;
//       this.rankMax = this.RANK_CUTOFF;
//     },

//     draw(p, manager, ai, progress) {
//       this.ensureInit(p);

//       const { table } = this.getCurrentData();

//       if (!this.menTable) {
//         p.background(240);
//         p.fill(80);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.noStroke();
//         p.text("Loading men's data...", p.width / 2, p.height / 2);
//         return;
//       }

//       if (!this.womenTable) {
//         p.background(240);
//         p.fill(80);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.noStroke();
//         p.text("Loading women's data...", p.width / 2, p.height / 2);
//         return;
//       }

//       if (!table || this.yearMin === null) {
//         p.background(240);
//         p.fill(80);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.noStroke();
//         const gender = this.currentGender === "men" ? "Men's" : "Women's";
//         p.text(`${gender} data not ready...`, p.width / 2, p.height / 2);
//         return;
//       }

//       p.background(240);
//       this.points = [];

//       this.drawAxes(p);

//       const { players } = this.getCurrentData();
//       for (let name of players) {
//         this.drawPlayerLine(p, name);
//       }

//       this.drawLegendAndToggle(p);
//       this.drawTooltip(p);
//     },

//     // Title & subtitle now centered on full canvas; chart is drawn lower
//     drawAxes(p) {
//       // --- Title + subtitle (no translation, center on full width) ---
//       const titleLabel = this.currentGender === "men" ?
//         "Big 3 ATP Year-end Rankings and Grand Slam Wins" :
//         "WTA Year-end Rankings and Grand Slam Wins";

//       p.push();
//       p.textAlign(p.CENTER, p.CENTER);
//       p.textSize(16);
//       p.fill(40);
//       p.textStyle(p.BOLD);
//       p.text(titleLabel, p.width / 2, this.margin.top - 35);

//       p.textSize(11);
//       p.fill(80);
//       p.textStyle(p.NORMAL);
//       p.text(
//         "Hover over points for season details.",
//         p.width / 2,
//         this.margin.top - 17
//       );
//       p.pop();

//       // --- Axes & grid (translate to chart area, slightly lower) ---
//       p.push();
//       p.translate(this.margin.left, this.margin.top + this.chartOffsetY);

//       p.stroke(200);
//       p.strokeWeight(1);

//       // x-axis
//       p.stroke(100);
//       p.line(0, this.chartH, this.chartW, this.chartH);

//       for (let y = this.yearMin; y <= this.yearMax; y += 2) {
//         let x = p.map(y, this.yearMin, this.yearMax, 0, this.chartW);
//         p.stroke(100);
//         p.line(x, this.chartH, x, this.chartH + 5);

//         p.textSize(10);
//         p.noStroke();
//         p.fill(80);
//         p.textAlign(p.CENTER, p.CENTER);
//         p.text(y, x, this.chartH + 20);

//         p.stroke(220);
//         p.line(x, 0, x, this.chartH);
//       }

//       // y-axis
//       p.stroke(100);
//       p.line(0, 0, 0, this.chartH);
//       p.textAlign(p.RIGHT, p.CENTER);

//       for (let r = this.rankMin; r <= this.rankMax; r += 5) {
//         let y = p.map(r, this.rankMin, this.rankMax, 0, this.chartH);

//         // tick mark
//         p.stroke(100);
//         p.line(-5, y, 0, y);

//         p.noStroke();
//         p.textSize(10);
//         p.fill(80);

//         // emphasize rank 1 visually
//         if (r === 1) {
//           p.textStyle(p.BOLD);
//         } else {
//           p.textStyle(p.NORMAL);
//         }
//         p.text(r, -10, y);

//         // grid line
//         if (r === 1) {
//           p.stroke(150);
//         } else {
//           p.stroke(220);
//         }
//         p.line(0, y, this.chartW, y);
//       }

//       // Axis labels (BOLD)
//       p.noStroke();
//       p.textAlign(p.CENTER);
//       p.textSize(12);
//       p.fill(60);
//       p.textStyle(p.BOLD);
//       p.text("Year", this.chartW / 2, this.chartH + 45);

//       p.push();
//       p.translate(-50, this.chartH / 2);
//       p.rotate(-p.HALF_PI);
//       const axisLabel = this.currentGender === "men" ?
//         "Year-end ATP Ranking (lower is better)" :
//         "Year-end WTA Ranking (lower is better)";
//       p.text(axisLabel, 0, 0);
//       p.pop();

//       p.pop();
//     },

//     drawPlayerLine(p, playerName) {
//       const { table } = this.getCurrentData();

//       const rows = [];
//       for (let r = 0; r < table.getRowCount(); r++) {
//         if (table.getString(r, "player_name") === playerName) {
//           rows.push(table.getRow(r));
//         }
//       }

//       rows.sort((a, b) => parseInt(a.get("year")) - parseInt(b.get("year")));

//       const pts = [];
//       for (let row of rows) {
//         const year = parseInt(row.get("year"));
//         const rankStr = row.get("rank");
//         const trueRank = parseInt(rankStr);
//         if (Number.isNaN(trueRank)) continue;

//         const slamsStr = row.get("slam_wins");
//         const slams = slamsStr === "" ? 0 : parseInt(slamsStr);
//         const slamNames = row.get("slam_names") || "";

//         const x = p.map(year, this.yearMin, this.yearMax, 0, this.chartW);

//         const isClipped = trueRank > this.rankMax;
//         const rankForPlot = isClipped ? this.rankMax : trueRank;
//         const y = p.map(rankForPlot, this.rankMin, this.rankMax, 0, this.chartH);

//         pts.push({
//           x, y, year,
//           rank: trueRank,
//           slams,
//           slamNames,
//           player: playerName,
//           isClipped
//         });
//       }

//       p.push();
//       p.translate(this.margin.left, this.margin.top + this.chartOffsetY);

//       const isDimmed = this.highlightedPlayer && this.highlightedPlayer !== playerName;
//       const c = this.colors[playerName];

//       // Ranking line
//       if (isDimmed) {
//         p.stroke(c.levels[0], c.levels[1], c.levels[2], 80);
//         p.strokeWeight(1);
//       } else {
//         p.stroke(c);
//         p.strokeWeight(2.5);
//       }

//       p.noFill();
//       p.beginShape();
//       for (let pt of pts) {
//         p.vertex(pt.x, pt.y);
//       }
//       p.endShape();

//       // Draw points
//       for (let pt of pts) {
//         // slightly larger for rank-1 non-Slam seasons
//         const baseRadius = pt.slams > 0 ? 5 : (pt.rank === 1 ? 3 : 2);
//         const extra = pt.slams > 0 ? Math.min(pt.slams, 3) * 1.5 : 0;
//         const r = baseRadius + extra;

//         if (pt.isClipped) {
//           const bottomY = this.chartH;
//           const triSize = 6;
//           p.noStroke();
//           p.fill(isDimmed ? p.color(c.levels[0], c.levels[1], c.levels[2], 100) : c);
//           p.triangle(
//             pt.x, bottomY + triSize,
//             pt.x - triSize / 2, bottomY,
//             pt.x + triSize / 2, bottomY
//           );
//         } else if (pt.slams > 0) {
//           if (!isDimmed) {
//             p.noStroke();
//             p.fill(c.levels[0], c.levels[1], c.levels[2], 60);
//             p.ellipse(pt.x, pt.y, (r + 4) * 2, (r + 4) * 2);
//           }

//           p.stroke(255);
//           p.strokeWeight(2);
//           p.fill(isDimmed ? p.color(c.levels[0], c.levels[1], c.levels[2], 120) : c);
//           p.ellipse(pt.x, pt.y, r * 2, r * 2);
//         } else {
//           p.noStroke();
//           p.fill(
//             isDimmed
//               ? p.color(c.levels[0], c.levels[1], c.levels[2], 60)
//               : p.color(c.levels[0], c.levels[1], c.levels[2], 180)
//           );
//           p.ellipse(pt.x, pt.y, r * 2, r * 2);
//         }

//         this.points.push({
//           ...pt,
//           screenX: pt.x + this.margin.left,
//           screenY: pt.y + this.margin.top + this.chartOffsetY,
//           radius: r
//         });
//       }

//       p.pop();
//     },

//   drawLegendAndToggle(p) {
//   p.push();

//   // Width of the button AND the card
//   const panelW = 150;

//   // SHIFT RIGHT so it never gets cut off
//   const x0 = p.width - this.margin.right + 35; 
//   const y0 = this.margin.top;

//   const { players } = this.getCurrentData();

//   // Toggle button geometry
//   const toggleW = panelW;
//   const toggleH = 32;
//   const toggleX = x0;
//   const toggleY = y0 + 5;

//   // Extra height if reset button appears
//   const extraResetSpace = this.highlightedPlayer ? 40 : 0;

//   // Card (border) dimensions
//   const cardX = toggleX;
//   const cardY = toggleY - 8;
//   const cardW = toggleW;
//   const cardH = 150 + players.length * 22 + extraResetSpace;

//   // Draw card background + border
//   p.fill(255);
//   p.stroke(210);
//   p.strokeWeight(1);
//   p.rect(cardX, cardY, cardW, cardH, 14);

//   // --- Toggle button ---
//   const isToggleHovering =
//     p.mouseX > toggleX && p.mouseX < toggleX + toggleW &&
//     p.mouseY > toggleY && p.mouseY < toggleY + toggleH;

//   if (this.currentGender === "men") {
//     p.fill(isToggleHovering ? p.color(44, 103, 230) : p.color(70, 130, 240));
//   } else {
//     p.fill(isToggleHovering ? p.color(255, 105, 180) : p.color(255, 130, 200));
//   }
//   p.noStroke();
//   p.rect(toggleX, toggleY, toggleW, toggleH, 10);

//   p.fill(255);
//   p.textSize(11);
//   p.textAlign(p.CENTER, p.CENTER);
//   const toggleLabel = this.currentGender === "men" ? "MEN'S ATP" : "WOMEN'S WTA";
//   p.text(toggleLabel, toggleX + toggleW / 2, toggleY + toggleH / 2);

//   // Instruction
//   p.fill(120);
//   p.textSize(11);
//   p.text("Click to switch", toggleX + toggleW / 2, toggleY + toggleH + 14);

//   // --- Legend items ---
//   const legendStartY = toggleY + toggleH + 38;
//   p.textAlign(p.LEFT, p.CENTER);
//   p.textSize(11);
//   p.fill(60);
//   p.text("Players (click to highlight)", x0 + 8, legendStartY);

//   let i = 1;
//   for (let name of players) {
//     const yy = legendStartY + i * 22;
//     const isHighlighted = this.highlightedPlayer === name;
//     const isClickable =
//       p.mouseX > x0 && p.mouseX < x0 + panelW &&
//       p.mouseY > yy - 10 && p.mouseY < yy + 10;

//     if (isClickable) {
//       p.fill(242);
//       p.noStroke();
//       p.rect(x0 + 4, yy - 10, panelW - 8, 20, 6);
//     }

//     p.fill(this.colors[name]);
//     p.ellipse(x0 + 14, yy, 10, 10);

//     p.fill(isHighlighted ? 40 : 80);
//     p.text(name, x0 + 26, yy);

//     if (isHighlighted) {
//       p.fill(40);
//       p.textSize(9);
//       p.text("★", x0 + panelW - 16, yy);
//     }

//     i++;
//   }

//   const infoY = legendStartY + i * 22 + 6;
//   p.textSize(10);
//   p.fill(100);
//   p.text("● = Slam year", x0 + 10, infoY);
//   p.text("▼ = Rank > 20", x0 + 10, infoY + 14);

//   // --- Reset button (inside card) ---
//   if (this.highlightedPlayer) {
//     const resetY = infoY + 36;
//     const resetW = panelW - 20;
//     const resetH = 22;
//     const resetX = x0 + 10;

//     const isHovering =
//       p.mouseX > resetX && p.mouseX < resetX + resetW &&
//       p.mouseY > resetY && p.mouseY < resetY + resetH;

//     p.fill(isHovering ? 190 : 210);
//     p.stroke(160);
//     p.strokeWeight(1);
//     p.rect(resetX, resetY, resetW, resetH, 6);

//     p.noStroke();
//     p.fill(60);
//     p.textSize(10);
//     p.textAlign(p.CENTER, p.CENTER);
//     p.text("Show All", resetX + resetW / 2, resetY + resetH / 2);
//   }

//   p.pop();
// },
//     drawTooltip(p) {
//       let hovered = null;
//       for (let pt of this.points) {
//         const d = p.dist(p.mouseX, p.mouseY, pt.screenX, pt.screenY);
//         if (d <= pt.radius + 6) {
//           hovered = pt;
//           break;
//         }
//       }
//       if (!hovered) return;

//       const lines = [];
//       lines.push(hovered.player);
//       lines.push("Year: " + hovered.year);

//       let rankLine = "Rank: " + hovered.rank;
//       if (hovered.isClipped) {
//         rankLine += " (worse than #20)";
//       }
//       lines.push(rankLine);

//       if (hovered.slams > 0) {
//         lines.push("Slams: " + hovered.slams);
//         if (hovered.slamNames) {
//           lines.push(hovered.slamNames);
//         }
//       } else {
//         lines.push("No Slams this year");
//       }

//       const padding = 8;
//       p.textSize(10);
//       let w = 0;
//       for (let t of lines) {
//         w = Math.max(w, p.textWidth(t));
//       }
//       const h = lines.length * 15;

//       let x = hovered.screenX + 15;
//       let y = hovered.screenY - h - 15;
//       if (x + w + padding * 2 > p.width) x = p.width - w - padding * 2 - 5;
//       if (y < 0) y = hovered.screenY + 15;

//       p.fill(255);
//       p.stroke(150);
//       p.strokeWeight(1);
//       p.rect(x, y, w + padding * 2, h + padding * 2, 4);

//       p.noStroke();
//       p.fill(40);
//       p.textAlign(p.LEFT, p.TOP);
//       let ty = y + padding;
//       for (let i = 0; i < lines.length; i++) {
//         if (i === 0) {
//           p.textStyle(p.BOLD);
//         } else {
//           p.textStyle(p.NORMAL);
//         }
//         p.text(lines[i], x + padding, ty);
//         ty += 15;
//       }
//     },

//     handleClick(p) {
//       const panelW = 130;
//       const x0 = p.width - this.margin.right + 15;
//       const y0 = this.margin.top;

//       // Toggle button
//       const toggleW = panelW;
//       const toggleH = 30;
//       const toggleX = x0;
//       const toggleY = y0 + 5;

//       if (p.mouseX > toggleX && p.mouseX < toggleX + toggleW &&
//         p.mouseY > toggleY && p.mouseY < toggleY + toggleH) {
//         this.currentGender = this.currentGender === "men" ? "women" : "men";
//         this.highlightedPlayer = null;
//         this.computeRanges();
//         return true;
//       }

//       const legendStartY = toggleY + toggleH + 40;
//       const { players } = this.getCurrentData();

//       // Legend clicks
//       for (let i = 0; i < players.length; i++) {
//         const name = players[i];
//         const yy = legendStartY + (i + 1) * 22;

//         if (p.mouseX > x0 - 10 && p.mouseX < x0 + panelW &&
//           p.mouseY > yy - 10 && p.mouseY < yy + 10) {
//           this.highlightedPlayer = (this.highlightedPlayer === name) ? null : name;
//           return true;
//         }
//       }

//       // Reset button
//       if (this.highlightedPlayer) {
//         const infoY = legendStartY + (players.length + 1) * 22 + 10;
//         const resetY = infoY + 40;
//         const resetX = x0;
//         const resetW = panelW - 20;
//         const resetH = 22;

//         if (p.mouseX > resetX && p.mouseX < resetX + resetW &&
//           p.mouseY > resetY && p.mouseY < resetY + resetH) {
//           this.highlightedPlayer = null;
//           return true;
//         }
//       }

//       return false;
//     }
//   };

//   window.Viz_RQ2_RanksSlams = Viz;
// })();




// Viz_RQ2_RanksSlams.js
// Visualization for RQ2: ATP/WTA Year-end Rankings and Grand Slam Wins
(function () {
  const Viz = {
    currentGender: "men",  // toggle between "men" and "women"
    menTable: null,
    womenTable: null,

    // Players for each gender
    menPlayers: ["Roger Federer", "Rafael Nadal", "Novak Djokovic"],
    womenPlayers: ["Serena Williams", "Iga Swiatek", "Justine Henin"],

    colors: {},
    // More right margin so chart leaves clean space for legend card
    margin: { top: 80, right: 220, bottom: 60, left: 60 },
    chartW: 0,
    chartH: 0,
    chartOffsetY: 20,   // push chart down a bit under the title
    yearMin: null,
    yearMax: null,
    rankMin: null,
    rankMax: null,
    points: [],
    initialized: false,
    RANK_CUTOFF: 20,
    highlightedPlayer: null,

    ensureInit(p) {
      if (this.initialized) return;
      this.chartW = p.width - this.margin.left - this.margin.right;
      this.chartH = (p.height - this.margin.top - this.margin.bottom) * 0.90;

      // Colors for men (Big 3)
      this.colors["Roger Federer"] = p.color(2, 131, 131);
      this.colors["Rafael Nadal"] = p.color(44, 103, 230);
      this.colors["Novak Djokovic"] = p.color(255, 228, 96);

      // Colors for women
      this.colors["Serena Williams"] = p.color(255, 105, 180);
      this.colors["Iga Swiatek"] = p.color(147, 51, 234);
      this.colors["Justine Henin"] = p.color(34, 197, 94);

      // Load both CSV files
      if (!this.menTable) {
        p.loadTable(
          "data/processed/rankings_slams.csv",
          "csv",
          "header",
          (t) => {
            this.menTable = t;
            this.computeRanges();
          },
          (err) => {
            console.error("Error loading men's data:", err);
          }
        );
      }

      if (!this.womenTable) {
        p.loadTable(
          "data/processed/rankings_slams_WTA.csv",
          "csv",
          "header",
          (t) => {
            this.womenTable = t;
            this.computeRanges();
          },
          (err) => {
            console.error("Error loading women's data:", err);
            console.error("Check file path: data/processed/ranks_slams_WTA.csv");
          }
        );
      }

      this.initialized = true;
    },

    getCurrentData() {
      return {
        table: this.currentGender === "men" ? this.menTable : this.womenTable,
        players: this.currentGender === "men" ? this.menPlayers : this.womenPlayers
      };
    },

    computeRanges() {
      const { table } = this.getCurrentData();
      if (!table || table.getRowCount() === 0) return;

      const years = [];
      for (let r = 0; r < table.getRowCount(); r++) {
        const yearVal = table.getString(r, "year");
        if (yearVal) years.push(parseInt(yearVal));
      }

      if (years.length > 0) {
        this.yearMin = Math.min(...years);
        this.yearMax = Math.max(...years);
      }

      this.rankMin = 1;
      this.rankMax = this.RANK_CUTOFF;
    },

    draw(p, manager, ai, progress) {
      this.ensureInit(p);

      const { table } = this.getCurrentData();

      if (!this.menTable) {
        p.background(240);
        p.fill(80);
        p.textAlign(p.CENTER, p.CENTER);
        p.noStroke();
        p.text("Loading men's data...", p.width / 2, p.height / 2);
        return;
      }

      if (!this.womenTable) {
        p.background(240);
        p.fill(80);
        p.textAlign(p.CENTER, p.CENTER);
        p.noStroke();
        p.text("Loading women's data...", p.width / 2, p.height / 2);
        return;
      }

      if (!table || this.yearMin === null) {
        p.background(240);
        p.fill(80);
        p.textAlign(p.CENTER, p.CENTER);
        p.noStroke();
        const gender = this.currentGender === "men" ? "Men's" : "Women's";
        p.text(`${gender} data not ready...`, p.width / 2, p.height / 2);
        return;
      }

      p.background(240);
      this.points = [];

      this.drawAxes(p);

      const { players } = this.getCurrentData();
      for (let name of players) {
        this.drawPlayerLine(p, name);
      }

      this.drawLegendAndToggle(p);
      this.drawTooltip(p);
    },

    // Title & subtitle on full canvas; chart drawn lower
    drawAxes(p) {
      const titleLabel = this.currentGender === "men"
        ? "Big 3 ATP Year-end Rankings and Grand Slam Wins"
        : "WTA Year-end Rankings and Grand Slam Wins";

      // --- Title + subtitle ---
      p.push();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.fill(40);
      p.textStyle(p.BOLD);
      p.text(titleLabel, p.width / 2, this.margin.top - 35);

      p.textSize(11);
      p.fill(80);
      p.textStyle(p.NORMAL);
      p.text(
        "Hover over points for season details.",
        p.width / 2,
        this.margin.top - 17
      );
      p.pop();

      // --- Axes & grid ---
      p.push();
      p.translate(this.margin.left, this.margin.top + this.chartOffsetY);

      p.stroke(200);
      p.strokeWeight(1);

      // x-axis
      p.stroke(100);
      p.line(0, this.chartH, this.chartW, this.chartH);

      for (let y = this.yearMin; y <= this.yearMax; y += 2) {
        let x = p.map(y, this.yearMin, this.yearMax, 0, this.chartW);
        p.stroke(100);
        p.line(x, this.chartH, x, this.chartH + 5);

        p.textSize(10);
        p.noStroke();
        p.fill(80);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(y, x, this.chartH + 20);

        p.stroke(220);
        p.line(x, 0, x, this.chartH);
      }

      // y-axis
      p.stroke(100);
      p.line(0, 0, 0, this.chartH);
      p.textAlign(p.RIGHT, p.CENTER);

      for (let r = this.rankMin; r <= this.rankMax; r += 5) {
        let y = p.map(r, this.rankMin, this.rankMax, 0, this.chartH);

        p.stroke(100);
        p.line(-5, y, 0, y);

        p.noStroke();
        p.textSize(10);
        p.fill(80);

        if (r === 1) {
          p.textStyle(p.BOLD);
        } else {
          p.textStyle(p.NORMAL);
        }
        p.text(r, -10, y);

        if (r === 1) {
          p.stroke(150);
        } else {
          p.stroke(220);
        }
        p.line(0, y, this.chartW, y);
      }

      // Axis labels (BOLD)
      p.noStroke();
      p.textAlign(p.CENTER);
      p.textSize(12);
      p.fill(60);
      p.textStyle(p.BOLD);
      p.text("Year", this.chartW / 2, this.chartH + 45);

      p.push();
      p.translate(-50, this.chartH / 2);
      p.rotate(-p.HALF_PI);
      const axisLabel = this.currentGender === "men"
        ? "Year-end ATP Ranking (lower is better)"
        : "Year-end WTA Ranking (lower is better)";
      p.text(axisLabel, 0, 0);
      p.pop();

      p.pop();
    },

    drawPlayerLine(p, playerName) {
      const { table } = this.getCurrentData();

      const rows = [];
      for (let r = 0; r < table.getRowCount(); r++) {
        if (table.getString(r, "player_name") === playerName) {
          rows.push(table.getRow(r));
        }
      }

      rows.sort((a, b) => parseInt(a.get("year")) - parseInt(b.get("year")));

      const pts = [];
      for (let row of rows) {
        const year = parseInt(row.get("year"));
        const rankStr = row.get("rank");
        const trueRank = parseInt(rankStr);
        if (Number.isNaN(trueRank)) continue;

        const slamsStr = row.get("slam_wins");
        const slams = slamsStr === "" ? 0 : parseInt(slamsStr);
        const slamNames = row.get("slam_names") || "";

        const x = p.map(year, this.yearMin, this.yearMax, 0, this.chartW);

        const isClipped = trueRank > this.rankMax;
        const rankForPlot = isClipped ? this.rankMax : trueRank;
        const y = p.map(rankForPlot, this.rankMin, this.rankMax, 0, this.chartH);

        pts.push({
          x, y, year,
          rank: trueRank,
          slams,
          slamNames,
          player: playerName,
          isClipped
        });
      }

      p.push();
      p.translate(this.margin.left, this.margin.top + this.chartOffsetY);

      const isDimmed = this.highlightedPlayer && this.highlightedPlayer !== playerName;
      const c = this.colors[playerName];

      if (isDimmed) {
        p.stroke(c.levels[0], c.levels[1], c.levels[2], 80);
        p.strokeWeight(1);
      } else {
        p.stroke(c);
        p.strokeWeight(2.5);
      }

      p.noFill();
      p.beginShape();
      for (let pt of pts) {
        p.vertex(pt.x, pt.y);
      }
      p.endShape();

      // Draw points
      for (let pt of pts) {
        const baseRadius = pt.slams > 0 ? 5 : (pt.rank === 1 ? 3 : 2);
        const extra = pt.slams > 0 ? Math.min(pt.slams, 3) * 1.5 : 0;
        const r = baseRadius + extra;

        if (pt.isClipped) {
          const bottomY = this.chartH;
          const triSize = 6;
          p.noStroke();
          p.fill(isDimmed ? p.color(c.levels[0], c.levels[1], c.levels[2], 100) : c);
          p.triangle(
            pt.x, bottomY + triSize,
            pt.x - triSize / 2, bottomY,
            pt.x + triSize / 2, bottomY
          );
        } else if (pt.slams > 0) {
          if (!isDimmed) {
            p.noStroke();
            p.fill(c.levels[0], c.levels[1], c.levels[2], 60);
            p.ellipse(pt.x, pt.y, (r + 4) * 2, (r + 4) * 2);
          }

          p.stroke(255);
          p.strokeWeight(2);
          p.fill(isDimmed ? p.color(c.levels[0], c.levels[1], c.levels[2], 120) : c);
          p.ellipse(pt.x, pt.y, r * 2, r * 2);
        } else {
          p.noStroke();
          p.fill(
            isDimmed
              ? p.color(c.levels[0], c.levels[1], c.levels[2], 60)
              : p.color(c.levels[0], c.levels[1], c.levels[2], 180)
          );
          p.ellipse(pt.x, pt.y, r * 2, r * 2);
        }

        this.points.push({
          ...pt,
          screenX: pt.x + this.margin.left,
          screenY: pt.y + this.margin.top + this.chartOffsetY,
          radius: r
        });
      }

      p.pop();
    },

    // Legend + gender toggle inside a card on the right
    drawLegendAndToggle(p) {
      p.push();

      const { players } = this.getCurrentData();

      // Card / panel geometry
      const panelW = 160;
      const cardX = p.width - this.margin.right + 30; // moved right so it isn't cut off
      const cardY = this.margin.top;                  // aligns visually with title area

      // How tall card needs to be
      const baseCardH = 130 + players.length * 22;
      const extraForReset = this.highlightedPlayer ? 40 : 0;
      const cardH = baseCardH + extraForReset;

      // Card background
      p.fill(255);
      p.stroke(210);
      p.strokeWeight(1);
      p.rect(cardX, cardY, panelW, cardH, 14);

      // Toggle button sitting at top of card
      const toggleMarginX = 10;
      const toggleMarginY = 10;
      const toggleW = panelW - 2 * toggleMarginX;
      const toggleH = 30;
      const toggleX = cardX + toggleMarginX;
      const toggleY = cardY + toggleMarginY;

      const isToggleHovering =
        p.mouseX > toggleX && p.mouseX < toggleX + toggleW &&
        p.mouseY > toggleY && p.mouseY < toggleY + toggleH;

      if (this.currentGender === "men") {
        p.fill(isToggleHovering ? p.color(44, 103, 230) : p.color(70, 130, 240));
      } else {
        p.fill(isToggleHovering ? p.color(255, 105, 180) : p.color(255, 130, 200));
      }
      p.noStroke();
      p.rect(toggleX, toggleY, toggleW, toggleH, 10);

      p.fill(255);
      p.textSize(11);
      p.textAlign(p.CENTER, p.CENTER);
      const toggleLabel = this.currentGender === "men" ? "MEN'S ATP" : "WOMEN'S WTA";
      p.text(toggleLabel, toggleX + toggleW / 2, toggleY + toggleH / 2);

      // Instruction text
      p.fill(120);
      p.textSize(11);
      p.text("Click to switch", cardX + panelW / 2, toggleY + toggleH + 14);

      // Legend heading
      const legendStartY = toggleY + toggleH + 38;
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(11);
      p.noStroke();
      p.fill(60);
      p.text("Players (click to highlight)", cardX + 10, legendStartY);

      // Player list
      let i = 1;
      for (let name of players) {
        const yy = legendStartY + i * 22;
        const isHighlighted = this.highlightedPlayer === name;
        const rowX = cardX + 10;

        const isClickable =
          p.mouseX > cardX && p.mouseX < cardX + panelW &&
          p.mouseY > yy - 10 && p.mouseY < yy + 10;

        if (isClickable) {
          p.fill(242);
          p.noStroke();
          p.rect(cardX + 6, yy - 10, panelW - 12, 20, 6);
        }

        p.fill(this.colors[name]);
        p.ellipse(rowX + 4, yy, 10, 10);

        p.fill(isHighlighted ? 40 : 80);
        p.textSize(11);
        p.text(name, rowX + 18, yy);

        if (isHighlighted) {
          p.fill(40);
          p.textSize(9);
          p.text("★", cardX + panelW - 18, yy);
        }

        i++;
      }

      const infoY = legendStartY + i * 22 + 6;
      p.textSize(10);
      p.fill(100);
      p.text("● = Slam year", cardX + 14, infoY);
      p.text("▼ = Rank > 20", cardX + 14, infoY + 14);

      // Reset button (Show All) stays inside card
      if (this.highlightedPlayer) {
        const resetY = infoY + 32;
        const resetW = panelW - 24;
        const resetH = 22;
        const resetX = cardX + 12;

        const isHovering =
          p.mouseX > resetX && p.mouseX < resetX + resetW &&
          p.mouseY > resetY && p.mouseY < resetY + resetH;

        p.fill(isHovering ? 190 : 210);
        p.stroke(160);
        p.strokeWeight(1);
        p.rect(resetX, resetY, resetW, resetH, 6);

        p.noStroke();
        p.fill(60);
        p.textSize(10);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("Show All", resetX + resetW / 2, resetY + resetH / 2);
      }

      p.pop();
    },

    drawTooltip(p) {
      let hovered = null;
      for (let pt of this.points) {
        const d = p.dist(p.mouseX, p.mouseY, pt.screenX, pt.screenY);
        if (d <= pt.radius + 6) {
          hovered = pt;
          break;
        }
      }
      if (!hovered) return;

      const lines = [];
      lines.push(hovered.player);
      lines.push("Year: " + hovered.year);

      let rankLine = "Rank: " + hovered.rank;
      if (hovered.isClipped) {
        rankLine += " (worse than #20)";
      }
      lines.push(rankLine);

      if (hovered.slams > 0) {
        lines.push("Slams: " + hovered.slams);
        if (hovered.slamNames) {
          lines.push(hovered.slamNames);
        }
      } else {
        lines.push("No Slams this year");
      }

      const padding = 8;
      p.textSize(10);
      let w = 0;
      for (let t of lines) {
        w = Math.max(w, p.textWidth(t));
      }
      const h = lines.length * 15;

      let x = hovered.screenX + 15;
      let y = hovered.screenY - h - 15;
      if (x + w + padding * 2 > p.width) x = p.width - w - padding * 2 - 5;
      if (y < 0) y = hovered.screenY + 15;

      p.fill(255);
      p.stroke(150);
      p.strokeWeight(1);
      p.rect(x, y, w + padding * 2, h + padding * 2, 4);

      p.noStroke();
      p.fill(40);
      p.textAlign(p.LEFT, p.TOP);
      let ty = y + padding;
      for (let i = 0; i < lines.length; i++) {
        if (i === 0) {
          p.textStyle(p.BOLD);
        } else {
          p.textStyle(p.NORMAL);
        }
        p.text(lines[i], x + padding, ty);
        ty += 15;
      }
    },

    handleClick(p) {
      const { players } = this.getCurrentData();

      const panelW = 160;
      const cardX = p.width - this.margin.right + 30;
      const cardY = this.margin.top;

      const toggleMarginX = 10;
      const toggleMarginY = 10;
      const toggleW = panelW - 2 * toggleMarginX;
      const toggleH = 30;
      const toggleX = cardX + toggleMarginX;
      const toggleY = cardY + toggleMarginY;

      // Toggle click
      if (p.mouseX > toggleX && p.mouseX < toggleX + toggleW &&
          p.mouseY > toggleY && p.mouseY < toggleY + toggleH) {
        this.currentGender = this.currentGender === "men" ? "women" : "men";
        this.highlightedPlayer = null;
        this.computeRanges();
        return true;
      }

      // Legend rows
      const legendStartY = toggleY + toggleH + 38;
      for (let i = 0; i < players.length; i++) {
        const name = players[i];
        const yy = legendStartY + (i + 1) * 22;

        if (p.mouseX > cardX && p.mouseX < cardX + panelW &&
            p.mouseY > yy - 10 && p.mouseY < yy + 10) {
          this.highlightedPlayer = (this.highlightedPlayer === name) ? null : name;
          return true;
        }
      }

      // Reset button
      if (this.highlightedPlayer) {
        const infoY = legendStartY + (players.length + 1) * 22 + 6;
        const resetY = infoY + 32;
        const resetW = panelW - 24;
        const resetH = 22;
        const resetX = cardX + 12;

        if (p.mouseX > resetX && p.mouseX < resetX + resetW &&
            p.mouseY > resetY && p.mouseY < resetY + resetH) {
          this.highlightedPlayer = null;
          return true;
        }
      }

      return false;
    }
  };

  window.Viz_RQ2_RanksSlams = Viz;
})();
