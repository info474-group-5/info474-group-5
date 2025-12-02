// viz_rq1_aggression_scatter.js
// RQ1B – Split tennis court design with better spacing

(function () {
  const Viz = {
    table: null,
    initialized: false,

    margin: { top: 110, right: 240, bottom: 80, left: 100 },
    chartW: 0,
    chartH: 0,

    tours: ["ATP", "WTA"],
    colors: {},
    series: {},

    isPlaying: false,
    playStartTime: null,
    playDuration: 5000,

    hoverPoint: null,

    ensureInit(p) {
      if (this.initialized) return;

      this.chartW = p.width - this.margin.left - this.margin.right;
      this.chartH = p.height - this.margin.top - this.margin.bottom;

      // Tennis ball colors: ATP = dark blue, WTA = hot pink
      this.colors["ATP"] = {
        main: p.color(30, 60, 140),      // Dark blue
        light: p.color(60, 100, 180),
        accent: p.color(20, 40, 100)
      };
      this.colors["WTA"] = {
        main: p.color(255, 20, 120),     // Hot pink
        light: p.color(255, 80, 160),
        accent: p.color(200, 0, 90)
      };

      this.table = p.loadTable(
        "data/processed/rqx_aggression_by_year.csv",
        "csv",
        "header",
        (t) => {
          this.table = t;
          this.processData();
        }
      );

      this.initialized = true;
    },

    processData() {
      if (!this.table) return;

      const byTour = { ATP: [], WTA: [] };

      for (let r = 0; r < this.table.getRowCount(); r++) {
        const year = parseInt(this.table.getString(r, "year"));
        const tour = this.table.getString(r, "tour");
        const aces100 = parseFloat(this.table.getString(r, "aces_per_100_points"));
        const domPct = parseFloat(this.table.getString(r, "serve_dom_index"));

        if (!year || isNaN(aces100) || isNaN(domPct)) continue;
        if (!(tour in byTour)) continue;

        byTour[tour].push({ year, aces: aces100, dom: domPct });
      }

      for (let t of this.tours) {
        byTour[t].sort((a, b) => a.year - b.year);
      }

      this.series = byTour;
      this.computeScales();
    },
    
    computeScales() {
      const courtGap = 20; // space between courts
      const halfW = (this.chartW - courtGap) / 2;
    
      // WTA on left, ATP on right
      const wtaCourtX = 0;
      const atpCourtX = halfW + courtGap;
    
      // --- Global dom (effectiveness) range across both tours ---
      let allDoms = [];
      for (let t of this.tours) {
        allDoms = allDoms.concat(this.series[t].map(d => d.dom));
      }
      const domMinGlobal = Math.min(...allDoms);
      const domMaxGlobal = Math.max(...allDoms);
      const domPad = (domMaxGlobal - domMinGlobal) * 0.2;
      // ----------------------------------------------------------
    
      for (let t of this.tours) {
        const data = this.series[t];
        const aces = data.map(d => d.aces);
    
        const acesMin = Math.min(...aces);
        const acesMax = Math.max(...aces);
        const acesPad = (acesMax - acesMin) * 0.2;
    
        const courtX = t === "WTA" ? wtaCourtX : atpCourtX;
    
        for (let d of data) {
          // X position within court half (per-tour)
          const xNorm = (d.aces - acesMin + acesPad) /
                        (acesMax - acesMin + 2 * acesPad || 1);
          d.x = courtX + xNorm * halfW;
    
          // Y position using SHARED scale
          const yNorm = (d.dom - domMinGlobal + domPad) /
                        (domMaxGlobal - domMinGlobal + 2 * domPad || 1);
          d.y = this.chartH - yNorm * this.chartH;
    
          // Ball size
          d.ballSize = 8 + yNorm * 6;
        }
    
        const sharedScale = {
          courtX: courtX,
          courtW: halfW,
          acesMin: acesMin - acesPad,
          acesMax: acesMax + acesPad,
          domMin: domMinGlobal - domPad,
          domMax: domMaxGlobal + domPad
        };
    
        if (t === "WTA") {
          this.wtaScales = sharedScale;
        } else {
          this.atpScales = sharedScale;
        }
      }
    },

    getAllYears() {
      const set = new Set();
      for (let t of this.tours) {
        for (let d of this.series[t]) set.add(d.year);
      }
      return Array.from(set).sort((a, b) => a - b);
    },

    draw(p, manager, ai, progress) {
      this.ensureInit(p);

      if (!this.table || !Object.keys(this.series).length) {
        p.background(250);
        p.fill(80);
        p.text("Loading serve data…", 40, 40);
        return;
      }

      p.background(252);

      p.push();
      p.translate(this.margin.left, this.margin.top);

      const years = this.getAllYears();
      let revealIdx = 0;

      if (this.isPlaying) {
        const elapsed = p.millis() - this.playStartTime;
        const t = Math.min(1, elapsed / this.playDuration);
        revealIdx = Math.round(t * years.length);
        if (t >= 1) this.isPlaying = false;
      } else {
        revealIdx = Math.round(p.constrain(progress * years.length, 0, years.length));
      }

      const currentYear = revealIdx < years.length ? years[revealIdx] : years[years.length - 1];

      // Draw split tennis courts
      this.drawTennisCourts(p);

      // Draw axes for both courts
      this.drawAxes(p);

      // Quadrant labels
      this.drawQuadrantLabels(p);

      // Trajectories
      this.drawTrajectories(p, currentYear);

      // Tennis balls
      this.drawBalls(p, currentYear);

      // Hover
      this.handleHover(p);

      // UI
      this.drawTitle(p, currentYear);
      this.drawLegendBox(p);
      this.drawPlayButton(p);

      p.pop();
    },

    drawTennisCourts(p) {
      const courtGap = 20;
      const halfW = (this.chartW - courtGap) / 2;

      // WTA court (left)
      this.drawSingleCourt(p, 0, 0, halfW, this.chartH, "WTA");

      // ATP court (right)
      this.drawSingleCourt(p, halfW + courtGap, 0, halfW, this.chartH, "ATP");
    },

    drawSingleCourt(p, x, y, w, h, tour) {
      // Clay court gradient
      p.noStroke();
      for (let i = 0; i < h; i += 4) {
        const t = i / h;
        const c = p.lerpColor(
          p.color(200, 135, 75),
          p.color(175, 110, 60),
          t
        );
        p.fill(c);
        p.rect(x, y + i, w, 4);
      }

      // Court boundary
      p.noFill();
      p.stroke(255, 255, 255, 220);
      p.strokeWeight(3);
      p.rect(x + 5, y + 5, w - 10, h - 10, 4);

      // Net (horizontal middle)
      p.strokeWeight(4);
      p.line(x + 5, y + h / 2, x + w - 5, y + h / 2);

      // Service lines
      p.strokeWeight(2);
      p.line(x + 5, y + h / 4, x + w - 5, y + h / 4);
      p.line(x + 5, y + (3 * h) / 4, x + w - 5, y + (3 * h) / 4);

      // Center line
      p.line(x + w / 2, y + h / 4, x + w / 2, y + (3 * h) / 4);


    },

    drawAxes(p) {
      const wtaS = this.wtaScales;
      const atpS = this.atpScales;

      // WTA axes (left court)
      this.drawCourtAxes(p, wtaS, "WTA");

      // ATP axes (right court)
      this.drawCourtAxes(p, atpS, "ATP");

      // ---- Shared X-axis label ----
      p.noStroke();
      p.fill(30);
      p.textSize(13);
      p.textStyle(p.BOLD);
      p.textAlign(p.CENTER, p.TOP);

      // position: centered under BOTH courts
      const centerX = this.chartW * 0.44;  // adjust if needed
      const labelY = this.chartH + 60;     // lowers the label

      p.text("Aggression: Aces per 100 Serve Points (-> More Aggressive)", centerX, labelY);

    },

    drawCourtAxes(p, scales, tour) {
      const x = scales.courtX;
      const w = scales.courtW;

      // Bottom axis line
      p.stroke(60);
      p.strokeWeight(2.5);
      p.line(x, this.chartH, x + w, this.chartH);

      // Left axis line
      p.line(x, 0, x, this.chartH);

      p.textSize(9);
      p.fill(30);
      p.textStyle(p.NORMAL);

      // X-axis ticks
      const xTicks = 4;
      p.textAlign(p.CENTER, p.TOP);
      for (let i = 0; i <= xTicks; i++) {
        const val = p.lerp(scales.acesMin, scales.acesMax, i / xTicks);
        const xx = x + (i / xTicks) * w;

        p.noStroke();
        p.text(val.toFixed(1), xx, this.chartH + 8);

        p.stroke(200, 80);
        p.strokeWeight(1);
      }

      // Y-axis ticks (only on left side)
      const yTicks = 5;
      p.textAlign(p.RIGHT, p.CENTER);
      for (let i = 0; i <= yTicks; i++) {
        const val = p.lerp(scales.domMin, scales.domMax, i / yTicks);
        const yy = this.chartH - (i / yTicks) * this.chartH;

        p.noStroke();
        if (tour === "WTA") {
          p.text(val.toFixed(0) + "%", x - 8, yy);
        }

        p.stroke(200, 80);
        p.strokeWeight(1);
        p.line(x, yy, x + w, yy);
      }

      // Axis labels
      p.noStroke();
      p.fill(20);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(11);
      p.textStyle(p.BOLD);
      p.text(tour, x + w / 2, this.chartH + 32);


      p.textAlign(p.CENTER, p.TOP);
      p.textSize(11);
      p.textStyle(p.BOLD);


      if (tour === "WTA") {
        p.push();
        p.translate(x - 50, this.chartH / 2);
        p.rotate(-p.HALF_PI);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(11);
        p.textStyle(p.BOLD);
        p.text("Serve Effectiveness (%)", 0, 0);
        p.pop();
      }


    },

    drawQuadrantLabels(p) {
      const wtaS = this.wtaScales;
      const atpS = this.atpScales;

      p.fill(255, 255, 255, 150);
      p.textSize(9);
      p.textStyle(p.ITALIC);

      // WTA quadrants
      p.textAlign(p.LEFT, p.TOP);
      p.text("Low agg.\nHigh effect.", wtaS.courtX + 10, 10);
      p.textAlign(p.RIGHT, p.TOP);
      p.text("High agg.\nHigh effect.", wtaS.courtX + wtaS.courtW - 10, 10);

      // ATP quadrants
      p.textAlign(p.LEFT, p.TOP);
      p.text("Low agg.\nHigh effect.", atpS.courtX + 10, 10);
      p.textAlign(p.RIGHT, p.TOP);
      p.text("High agg.\nHigh effect.", atpS.courtX + atpS.courtW - 10, 10);
    },

    drawTrajectories(p, currentYear) {
      for (let t of this.tours) {
        const data = this.series[t];
        const colorSet = this.colors[t];

        // Path line
        p.noFill();
        p.stroke(colorSet.light);
        p.strokeWeight(3);

        p.beginShape();
        for (let d of data) {
          if (d.year <= currentYear) {
            p.vertex(d.x, d.y);
          }
        }
        p.endShape();
      }
    },

    drawBalls(p, currentYear) {
      for (let t of this.tours) {
        const data = this.series[t];
        const colorSet = this.colors[t];

        for (let i = 0; i < data.length; i++) {
          const d = data[i];
          if (d.year > currentYear) continue;

          const isFirst = (i === 0);
          const isCurrent = (d.year === currentYear);
          const showLabel = (d.year % 5 === 0) || isFirst || isCurrent;

          const r = d.ballSize;

          // Tennis ball (solid, no glow)
          p.noStroke();
          p.fill(colorSet.main);
          p.circle(d.x, d.y, r * 2);

          // Tennis ball seam
          p.noFill();
          p.stroke(255, 220);
          p.strokeWeight(1);
          p.arc(d.x, d.y, r * 1.5, r * 1.5, -p.PI / 4, p.PI / 4);
          p.arc(d.x, d.y, r * 1.5, r * 1.5, p.PI * 3 / 4, p.PI * 5 / 4);

          // Highlight
          p.noStroke();
          p.fill(255, 255, 255, 200);
          p.circle(d.x - r * 0.25, d.y - r * 0.25, r * 0.4);

          // Year labels
          if (showLabel) {
            p.fill(colorSet.accent);
            p.textSize(isCurrent ? 11 : 9);
            p.textStyle(p.BOLD);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.noStroke();

            // White background
            const txtW = p.textWidth(d.year.toString()) + 3;
            p.fill(255, 240);
            p.rect(d.x - txtW / 2, d.y - r - 14, txtW, 11, 2);

            p.fill(colorSet.accent);
            p.text(d.year, d.x, d.y - r - 5);

            // Current year values
            if (isCurrent) {
              p.textSize(8);
              p.textStyle(p.NORMAL);
              p.textAlign(p.CENTER, p.TOP);
              const valTxt = `${d.aces.toFixed(1)} | ${d.dom.toFixed(0)}%`;
              const valW = p.textWidth(valTxt) + 3;
              p.fill(255, 240);
              p.rect(d.x - valW / 2, d.y + r + 3, valW, 11, 2);
              p.fill(colorSet.accent);
              p.text(valTxt, d.x, d.y + r + 5);
            }
          }
        }
      }
    },

    handleHover(p) {
      const mx = p.mouseX - this.margin.left;
      const my = p.mouseY - this.margin.top;

      this.hoverPoint = null;
      let bestDist = 18;

      for (let t of this.tours) {
        for (let d of this.series[t]) {
          const dist = Math.sqrt((mx - d.x) ** 2 + (my - d.y) ** 2);
          if (dist < bestDist) {
            bestDist = dist;
            this.hoverPoint = { tour: t, ...d };
          }
        }
      }

      if (this.hoverPoint) {
        const pt = this.hoverPoint;
        const colorSet = this.colors[pt.tour];

        // Highlight ring
        p.noFill();
        p.stroke(colorSet.accent);
        p.strokeWeight(2);
        p.circle(pt.x, pt.y, pt.ballSize * 2.5);

        // Tooltip
        const lines = [
          `${pt.tour} — ${pt.year}`,
          `Aggression: ${pt.aces.toFixed(2)}`,
          `Effectiveness: ${pt.dom.toFixed(1)}%`
        ];
        this.drawTooltip(p, pt.x, pt.y, lines, colorSet);
      }
    },

    drawTooltip(p, x, y, lines, colorSet) {
      const padding = 7;
      p.textSize(10);
      p.textStyle(p.NORMAL);

      let maxW = 0;
      for (let txt of lines) maxW = Math.max(maxW, p.textWidth(txt));

      const boxW = maxW + padding * 2;
      const boxH = lines.length * 13 + padding * 2;

      let boxX = x + 18;
      let boxY = y - boxH / 2;

      if (boxX + boxW > this.chartW) boxX = x - boxW - 18;
      if (boxY < 0) boxY = 5;
      if (boxY + boxH > this.chartH) boxY = this.chartH - boxH - 5;

      p.fill(255, 250);
      p.stroke(colorSet.accent);
      p.strokeWeight(2);
      p.rect(boxX, boxY, boxW, boxH, 5);

      p.noStroke();
      p.textAlign(p.LEFT, p.TOP);
      let ty = boxY + padding;
      for (let i = 0; i < lines.length; i++) {
        p.fill(i === 0 ? colorSet.accent : 40);
        p.textStyle(i === 0 ? p.BOLD : p.NORMAL);
        p.text(lines[i], boxX + padding, ty);
        ty += 13;
      }
    },

    drawTitle(p, currentYear) {
      p.noStroke();
      p.fill(20);
      p.textAlign(p.LEFT, p.BOTTOM);
      p.textSize(20);
      p.textStyle(p.BOLD);
      p.text("Serve Evolution: Aggression vs. Effectiveness", 0, -75);

      p.textSize(12);
      p.textStyle(p.NORMAL);
      p.fill(80);
      p.text("Split courts show each tour's journey from 2000 to 2024", 0, -55);

      // Year box
      p.fill(255, 250);
      p.stroke(120);
      p.strokeWeight(1.5);
      const yearBoxX = this.chartW - 110;
      p.rect(yearBoxX, -60, 110, 32, 6);

      p.noStroke();
      p.fill(40);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.textStyle(p.NORMAL);
      p.text("SEASON", yearBoxX + 55, -52);

      p.textSize(18);
      p.textStyle(p.BOLD);
      p.text(currentYear, yearBoxX + 55, -37);
    },

    drawLegendBox(p) {
      const boxX = this.chartW + 20;
      const boxY = 10;
      const boxW = 200;
      const boxH = 180;

      p.fill(255, 252);
      p.stroke(180);
      p.strokeWeight(1.5);
      p.rect(boxX, boxY, boxW, boxH, 8);

      p.noStroke();
      p.fill(30);
      p.textSize(13);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.TOP);
      p.text("LEGEND", boxX + 12, boxY + 12);

      p.textStyle(p.NORMAL);
      p.textSize(10);
      p.fill(60);
      p.text("Each tour on separate court\nRight & Up = Better serving", boxX + 12, boxY + 35);

      let yPos = boxY + 75;

      // ATP ball
      p.fill(this.colors["ATP"].main);
      p.circle(boxX + 25, yPos, 14);
      p.noFill();
      p.stroke(255, 220);
      p.strokeWeight(1);
      p.arc(boxX + 25, yPos, 12, 12, -p.PI / 4, p.PI / 4);

      p.noStroke();
      p.fill(40);
      p.textSize(12);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.CENTER);
      p.text("ATP Tour", boxX + 45, yPos);

      p.textStyle(p.NORMAL);
      p.textSize(10);
      p.fill(100);
      p.text("Men", boxX + 45, yPos + 13);

      yPos += 50;

      // WTA ball
      p.fill(this.colors["WTA"].main);
      p.circle(boxX + 25, yPos, 14);
      p.noFill();
      p.stroke(255, 220);
      p.strokeWeight(1);
      p.arc(boxX + 25, yPos, 12, 12, -p.PI / 4, p.PI / 4);

      p.noStroke();
      p.fill(40);
      p.textSize(12);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.CENTER);
      p.text("WTA Tour", boxX + 45, yPos);

      p.textStyle(p.NORMAL);
      p.textSize(10);
      p.fill(100);
      p.text("Women", boxX + 45, yPos + 13);
    },

    drawPlayButton(p) {
      const btnX = this.chartW + 30;
      const btnY = 210;
      const btnW = 180;
      const btnH = 38;

      const mx = p.mouseX - this.margin.left;
      const my = p.mouseY - this.margin.top;
      const isHover = mx > btnX && mx < btnX + btnW && my > btnY && my < btnY + btnH;

      if (isHover) {
        p.fill(240, 250, 245);
        p.stroke(80, 180, 120);
        p.strokeWeight(2.5);
      } else {
        p.fill(255);
        p.stroke(150);
        p.strokeWeight(1.5);
      }
      p.rect(btnX, btnY, btnW, btnH, 8);

      p.noStroke();
      p.fill(isHover ? 30 : 60);
      p.textSize(12);
      p.textStyle(p.BOLD);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(this.isPlaying ? "⏸ PLAYING..." : "▶ WATCH EVOLUTION", btnX + btnW / 2, btnY + btnH / 2);
    },

    handleClick(p) {
      const btnX = this.chartW + 30;
      const btnY = 210;
      const btnW = 180;
      const btnH = 38;

      const mx = p.mouseX - this.margin.left;
      const my = p.mouseY - this.margin.top;

      if (mx > btnX && mx < btnX + btnW && my > btnY && my < btnY + btnH) {
        if (!this.isPlaying) {
          this.isPlaying = true;
          this.playStartTime = p.millis();
        } else {
          this.isPlaying = false;
        }
        return true;
      }
      return false;
    }
  };

  window.VizRQ1_AggScatter = Viz;
})();
