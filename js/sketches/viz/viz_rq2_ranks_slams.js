(function () {
 const Viz = {
   table: null,
   players: ["Roger Federer", "Rafael Nadal", "Novak Djokovic"],
   colors: {},
   margin: { top: 50, right: 180, bottom: 50, left: 70 },
   chartW: 0,
   chartH: 0,
   yearMin: null,
   yearMax: null,
   rankMin: null,
   rankMax: null,
   points: [],
   initialized: false,
   RANK_CUTOFF: 20,   // only show top 20 on the y-axis


   ensureInit(p) {
     if (this.initialized) return;
     this.chartW = p.width - this.margin.left - this.margin.right;
     this.chartH = p.height - this.margin.top - this.margin.bottom;


     // colors for Big 3
     this.colors["Roger Federer"]  = p.color(2, 131, 131);
     this.colors["Rafael Nadal"]   = p.color(44, 103, 230);
     this.colors["Novak Djokovic"] = p.color(255, 228, 96);


     // load the CSV once
     if (!this.table) {
       this.table = p.loadTable(
         "data/processed/rankings_slams.csv",
         "csv",
         "header",
         (t) => {
           this.table = t;
           this.computeRanges();
         }
       );
     }
     this.initialized = true;
   },


   computeRanges() {
     if (!this.table || this.table.getRowCount() === 0) return;


     const years = [];
     for (let r = 0; r < this.table.getRowCount(); r++) {
       years.push(parseInt(this.table.getString(r, "year")));
     }
     this.yearMin = Math.min(...years);
     this.yearMax = Math.max(...years);


     // focus only on top 20 for y-axis
     this.rankMin = 1;
     this.rankMax = this.RANK_CUTOFF;
   },


   draw(p, manager, ai, progress) {
     this.ensureInit(p);
     // if data not ready yet, show loading
     if (!this.table || this.yearMin === null) {
       p.background(15);
       p.fill(230);
       p.textAlign(p.CENTER, p.CENTER);
       p.text("Loading rankings_slams.csv ...", p.width / 2, p.height / 2);
       return;
     }


     p.background(15);
     this.points = [];


     this.drawAxes(p);


     for (let name of this.players) {
       this.drawPlayerLine(p, name);
     }


     this.drawLegend(p);
     this.drawSlamsMiniChart(p);
     this.drawTooltip(p);
   },


   drawAxes(p) {
     p.push();
     p.translate(this.margin.left, this.margin.top);
     p.stroke(200);
     p.strokeWeight(1);
     p.fill(200);
     p.textAlign(p.CENTER, p.CENTER);


     // x-axis
     p.line(0, this.chartH, this.chartW, this.chartH);
     for (let y = this.yearMin; y <= this.yearMax; y += 2) {
       let x = p.map(y, this.yearMin, this.yearMax, 0, this.chartW);
       p.line(x, this.chartH, x, this.chartH + 5);
       p.textSize(10);
       p.noStroke();
       p.text(y, x, this.chartH + 15);
       p.stroke(60);
       p.line(x, 0, x, this.chartH); // vertical grid
       p.stroke(200);
     }


     // y-axis: 1 at top, 20 at bottom
     p.line(0, 0, 0, this.chartH);
     p.textAlign(p.RIGHT, p.CENTER);


     for (let r = this.rankMin; r <= this.rankMax; r += 5) {
       let y = p.map(r, this.rankMin, this.rankMax, 0, this.chartH);
       p.line(-5, y, 0, y);
       p.noStroke();
       p.textSize(10);
       p.text(r, -10, y);
       p.stroke(60);
       p.line(0, y, this.chartW, y); // horizontal grid
       p.stroke(200);
     }


     // labels and title
     p.noStroke();
     p.textAlign(p.CENTER);
     p.textSize(14);
     p.text("Year", this.chartW / 2, this.chartH + 35);


     p.push();
     p.translate(-45, this.chartH / 2);
     p.rotate(-p.HALF_PI);
     p.text("Year-end ATP Ranking (1–20 shown, lower is better)", 0, 0);
     p.pop();


     p.textSize(18);
     p.text(
       "Big 3 ATP Year-end Rankings and Grand Slam Wins",
       this.chartW / 2,
       -20
     );


     p.pop();
   },


   drawPlayerLine(p, playerName) {
     const rows = [];
     for (let r = 0; r < this.table.getRowCount(); r++) {
       if (this.table.getString(r, "player_name") === playerName) {
         rows.push(this.table.getRow(r));
       }
     }


     // sort by year
     rows.sort((a, b) => parseInt(a.get("year")) - parseInt(b.get("year")));


     const pts = [];
     for (let row of rows) {
       const year = parseInt(row.get("year"));
       const rankStr = row.get("rank");
       const trueRank = parseInt(rankStr);
       if (Number.isNaN(trueRank)) continue;


       const slamsStr = row.get("slam_wins");
       const slams = slamsStr === "" ? 0 : parseInt(slamsStr);
       const slamNames = row.get("slam_names");


       const x = p.map(year, this.yearMin, this.yearMax, 0, this.chartW);


       // clip anything worse than the cutoff to the bottom
       const isClipped = trueRank > this.rankMax;
       const rankForPlot = isClipped ? this.rankMax : trueRank;
       const y = p.map(rankForPlot, this.rankMin, this.rankMax, 0, this.chartH);


       pts.push({
         x,
         y,
         year,
         rank: trueRank,
         slams,
         slamNames,
         player: playerName,
         isClipped
       });
     }


     p.push();
     p.translate(this.margin.left, this.margin.top);


     // ranking line
     p.stroke(this.colors[playerName]);
     p.strokeWeight(2);
     p.noFill();
     p.beginShape();
     for (let pt of pts) {
       p.vertex(pt.x, pt.y);
     }
     p.endShape();


     const c = this.colors[playerName];


     for (let pt of pts) {
       // very small markers for non-slam years, a little larger for slam years
       const baseRadius = pt.slams > 0 ? 5 : 2;
       const extra = pt.slams > 0 ? Math.min(pt.slams, 3) * 1.5 : 0;
       const r = baseRadius + extra;


       if (pt.isClipped) {
         // triangle at very bottom to indicate rank > 20
         const bottomY = this.chartH;
         const triSize = 6;
         p.noStroke();
         p.fill(c);
         p.triangle(
           pt.x, bottomY + triSize,
           pt.x - triSize / 2, bottomY,
           pt.x + triSize / 2, bottomY
         );
       } else if (pt.slams > 0) {
         // slam year: white ring over player color
         // subtle halo
         p.noStroke();
         p.fill(255, 80);
         p.ellipse(pt.x, pt.y, (r + 3) * 2, (r + 3) * 2);


         // main circle
         p.stroke(255);
         p.strokeWeight(2);
         p.fill(c);
         p.ellipse(pt.x, pt.y, r * 2, r * 2);
       } else {
         // non-slam year: tiny colored dot so line feels continuous
         p.noStroke();
         p.fill(c.levels[0], c.levels[1], c.levels[2], 140);
         p.ellipse(pt.x, pt.y, r * 2, r * 2);
       }


       // store for tooltip hit-testing (only if inside chart)
       this.points.push({
         ...pt,
         screenX: pt.x + this.margin.left,
         screenY: pt.y + this.margin.top,
         radius: r
       });
     }


     p.pop();
   },


   drawLegend(p) {
     p.push();
     const x0 = p.width - this.margin.right + 20;
     const y0 = this.margin.top;


     p.textAlign(p.LEFT, p.CENTER);
     p.textSize(12);
     p.noStroke();
     p.fill(230);
     p.text("Players", x0, y0);


     let i = 1;
     for (let name of this.players) {
       const yy = y0 + i * 18;
       p.fill(this.colors[name]);
       p.ellipse(x0 - 10, yy, 10, 10);
       p.fill(230);
       p.text(name, x0 + 2, yy);
       i++;
     }


     const infoY = y0 + i * 20 + 4;
     p.textSize(11);
     p.fill(230);
     p.text("White ring = Slam year", x0, infoY);
     p.text("Triangle at bottom = rank > 20", x0, infoY + 16);


     p.pop();
   },


   // small side mini chart: slams by year for Big 3
   drawSlamsMiniChart(p) {
     if (!this.table) return;


     const panelX = p.width - this.margin.right + 10;
     const panelY = this.margin.top + 90;
     const panelW = this.margin.right - 30;
     const panelH = 160;


     p.push();
     p.translate(panelX, panelY);


     // panel background
     p.noStroke();
     p.fill(10, 220);
     p.rect(0, 0, panelW, panelH, 8);


     p.fill(230);
     p.textAlign(p.CENTER, p.TOP);
     p.textSize(11);
     p.text("Grand Slam wins by year", panelW / 2, 6);


     const innerPadL = 32;
     const innerPadR = 6;
     const innerPadTop = 24;
     const innerPadBottom = 10;


     const innerW = panelW - innerPadL - innerPadR;
     const innerH = panelH - innerPadTop - innerPadBottom;


     // y positions for players
     const playerY = {};
     const stepY = innerH / (this.players.length + 1);


     p.textAlign(p.RIGHT, p.CENTER);
     p.textSize(10);
     for (let i = 0; i < this.players.length; i++) {
       const name = this.players[i];
       const y = innerPadTop + stepY * (i + 1);
       playerY[name] = y;
       const lastName = name.split(" ").slice(-1)[0];
       p.fill(210);
       p.text(lastName, innerPadL - 4, y);
     }


     // axis line
     p.stroke(90);
     p.strokeWeight(1);
     p.line(innerPadL, innerPadTop, innerPadL, innerPadTop + innerH);


     // circles for slam years
     for (let r = 0; r < this.table.getRowCount(); r++) {
       const row = this.table.getRow(r);
       const player = row.get("player_name");
       if (!(player in playerY)) continue;


       const slamsStr = row.get("slam_wins");
       const slams = slamsStr === "" ? 0 : parseInt(slamsStr);
       if (!slams || slams <= 0) continue;


       const year = parseInt(row.get("year"));
       const x = p.map(year, this.yearMin, this.yearMax,
         innerPadL + 4, innerPadL + innerW - 4);
       const y = playerY[player];


       const size = 4 + Math.min(slams, 3) * 2;
       const col = this.colors[player];


       // halo
       p.noStroke();
       p.fill(255, 140);
       p.ellipse(x, y, size + 4, size + 4);


       // inner circle
       p.stroke(col);
       p.strokeWeight(1);
       p.fill(15);
       p.ellipse(x, y, size, size);
     }


     // simple year ticks along bottom
     p.textAlign(p.CENTER, p.TOP);
     p.textSize(9);
     p.noStroke();
     p.fill(190);
     const tickStep = Math.max(2, Math.round((this.yearMax - this.yearMin) / 4));
     for (let y = this.yearMin; y <= this.yearMax; y += tickStep) {
       const xTick = p.map(y, this.yearMin, this.yearMax,
         innerPadL + 4, innerPadL + innerW - 4);
       p.text(y, xTick, innerPadTop + innerH + 2);
     }


     p.pop();
   },


   drawTooltip(p) {
     let hovered = null;
     for (let pt of this.points) {
       const d = p.dist(p.mouseX, p.mouseY, pt.screenX, pt.screenY);
       if (d <= pt.radius + 4) {
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
       lines.push("# Slams: " + hovered.slams);
       lines.push(hovered.slamNames);
     } else {
       lines.push("No Slam wins this year");
     }


     const padding = 6;
     p.textSize(11);
     let w = 0;
     for (let t of lines) {
       w = Math.max(w, p.textWidth(t));
     }
     const h = lines.length * 14;


     let x = hovered.screenX + 12;
     let y = hovered.screenY - h - 12;
     if (x + w + padding * 2 > p.width) x = p.width - w - padding * 2 - 5;
     if (y < 0) y = hovered.screenY + 12;


     p.noStroke();
     p.fill(0, 200);
     p.rect(x, y, w + padding * 2, h + padding * 2, 5);


     p.fill(255);
     p.textAlign(p.LEFT, p.TOP);
     let ty = y + padding;
     for (let t of lines) {
       p.text(t, x + padding, ty);
       ty += 14;
     }
   }
 };


 window.Viz_RQ2_RanksSlams = Viz;
})();
