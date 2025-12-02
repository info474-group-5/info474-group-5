// viz_rq1_aggression_scatter.js
// RQ1B – "Serve Power Court": Creative tennis court visualization

(function () {
  const Viz = {
    table: null,
    initialized: false,

    margin: { top: 100, right: 240, bottom: 80, left: 80 },
    chartW: 0,
    chartH: 0,

    tours: ["ATP", "WTA"],
    colors: {},
    series: {},

    // store domains & court box for axes
    acesMin: null,
    acesMax: null,
    domMin: null,
    domMax: null,
    courtX: null,
    courtY: null,
    courtW: null,
    courtH: null,

    // Interactive state
    isPlaying: false,
    playStartTime: null,
    playDuration: 6000,
    
    hoverPoint: null,

    ensureInit(p) {
      if (this.initialized) return;

      this.chartW = p.width - this.margin.left - this.margin.right;
      this.chartH = p.height - this.margin.top - this.margin.bottom;

      // PROJECT COLORS: ATP dark blue, WTA hot pink
      this.colors["ATP"] = {
        main: p.color(30, 64, 175, 255),       // navy
        trail: p.color(30, 64, 175, 100),
        glow: p.color(30, 64, 175, 60),
        accent: p.color(23, 37, 84, 255)       // darker navy for labels
      };
      this.colors["WTA"] = {
        main: p.color(236, 72, 153, 255),      // hot pink
        trail: p.color(236, 72, 153, 100),
        glow: p.color(236, 72, 153, 60),
        accent: p.color(157, 23, 77, 255)      // deeper pink for labels
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
      this.computeCourtPositions();
    },

    computeCourtPositions() {
      // Map data to court positions
      // X-axis (horizontal): aggression (aces per 100) -> left to right (baseline to net)
      // Y-axis (vertical): serve dominance -> split court (WTA top, ATP bottom)
      
      let allAces = [], allDom = [];
      for (let t of this.tours) {
        allAces = allAces.concat(this.series[t].map(d => d.aces));
        allDom = allDom.concat(this.series[t].map(d => d.dom));
      }

      const acesMin = Math.min(...allAces);
      const acesMax = Math.max(...allAces);
      const domMin = Math.min(...allDom);
      const domMax = Math.max(...allDom);

      // save for axes
      this.acesMin = acesMin;
      this.acesMax = acesMax;
      this.domMin = domMin;
      this.domMax = domMax;

      // Court dimensions – slightly more zoomed in (bigger court, thinner side areas)
      const courtW = this.chartW * 0.88;
      const courtH = this.chartH * 0.88;
      const courtX = (this.chartW - courtW) / 2;
      const courtY = (this.chartH - courtH) / 2;

      this.courtW = courtW;
      this.courtH = courtH;
      this.courtX = courtX;
      this.courtY = courtY;

      for (let t of this.tours) {
        const isATP = (t === "ATP");
        
        for (let d of this.series[t]) {
          // X: aggression maps to depth on court (left=baseline, right=net)
          const acesNorm = (d.aces - acesMin) / (acesMax - acesMin || 1);
          d.courtX = courtX + acesNorm * courtW;

          // Y: dominance maps to height within tour's half.
          // Use most of each half (zoomed), less dead space.
          const domNorm = (d.dom - domMin) / (domMax - domMin || 1);
          
          if (isATP) {
            // ATP: bottom half of court
            const halfStart = courtY + courtH * 0.54;
            const halfHeight = courtH * 0.36;
            d.courtY = halfStart + (1 - domNorm) * halfHeight;
          } else {
            // WTA: top half of court
            const halfStart = courtY + courtH * 0.10;
            const halfHeight = courtH * 0.36;
            d.courtY = halfStart + (1 - domNorm) * halfHeight;
          }

          // Ball size based on dominance (bigger = more dominant)
          d.ballSize = 8 + domNorm * 12;
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
        p.text("Loading serve power data…", 40, 40);
        return;
      }

      p.background(252);

      p.push();
      p.translate(this.margin.left, this.margin.top);

      // Determine revealed year
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

      // Draw tennis court
      this.drawTennisCourt(p);

      // Axes + ticks (around the court)
      this.drawAxes(p);

      // Court zones, tour labels, evolution arrow
      this.drawCourtZones(p);

      // Draw ball trajectories
      this.drawBallTrajectories(p, currentYear);

      // Draw balls
      this.drawTennisBalls(p, currentYear);

      // Hover interaction
      this.handleHover(p);

      // Title and UI
      this.drawTitle(p, currentYear);
      this.drawLegendBox(p);
      this.drawPlayButton(p);

      p.pop();
    },

    drawTennisCourt(p) {
      const { courtX, courtY, courtW, courtH } = this;

      // Clay court gradient (terre battue)
      p.noStroke();
      for (let i = 0; i < courtH; i += 3) {
        const t = i / courtH;
        const c = p.lerpColor(
          p.color(205, 133, 63),  // Sandy brown
          p.color(178, 102, 51),  // Darker clay
          t
        );
        p.fill(c);
        p.rect(courtX, courtY + i, courtW, 3);
      }

      // Court lines (white) – slightly thinner to feel more "zoomed in"
      p.stroke(255, 255, 255, 240);
      p.strokeWeight(2.5);
      p.noFill();
      
      // Outer boundary
      p.rect(courtX, courtY, courtW, courtH, 4);

      // Net (center line)
      const netY = courtY + courtH / 2;
      p.strokeWeight(3);
      p.line(courtX, netY, courtX + courtW, netY);

      // Service boxes (a bit closer to baselines to reduce side dead space)
      const serviceLineY1 = courtY + courtH * 0.28;
      const serviceLineY2 = courtY + courtH * 0.72;
      p.strokeWeight(2);
      p.line(courtX, serviceLineY1, courtX + courtW, serviceLineY1);
      p.line(courtX, serviceLineY2, courtX + courtW, serviceLineY2);

      // Center service line
      const centerX = courtX + courtW / 2;
      p.line(centerX, serviceLineY1, centerX, netY);
      p.line(centerX, netY, centerX, serviceLineY2);

      // Baseline markers – thinner and closer to edges (so main court is visually bigger)
      p.strokeWeight(1.5);
      p.line(courtX, courtY + courtH * 0.06, courtX + courtW, courtY + courtH * 0.06);
      p.line(courtX, courtY + courtH * 0.94, courtX + courtW, courtY + courtH * 0.94);

      // Net post shadows
      p.noStroke();
      p.fill(0, 40);
      p.rect(courtX - 6, netY - 3, 6, 6);
      p.rect(courtX + courtW, netY - 3, 6, 6);
    },

    // NEW: Axes & quadrant ticks around the court
    drawAxes(p) {
      const { courtX, courtY, courtW, courtH, acesMin, acesMax, domMin, domMax } = this;

      if (acesMin == null) return;

      p.textSize(10);
      p.textStyle(p.NORMAL);
      p.fill(40);

      // X-axis along bottom of court
      const axisY = Math.min(this.chartH - 25, courtY + courtH + 18);
      p.stroke(120);
      p.strokeWeight(1.5);
      p.line(courtX, axisY, courtX + courtW, axisY);

      const xTicks = 4;
      for (let i = 0; i <= xTicks; i++) {
        const val = acesMin + (acesMax - acesMin) * (i / xTicks);
        const x = courtX + ((val - acesMin) / (acesMax - acesMin || 1)) * courtW;

        // tick
        p.line(x, axisY, x, axisY + 4);

        // label
        p.noStroke();
        p.textAlign(p.CENTER, p.TOP);
        p.text(val.toFixed(1), x, axisY + 6);
        p.stroke(120);
      }

      // X-axis label
      p.noStroke();
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(11);
      p.textStyle(p.BOLD); 
      p.fill(30);
      p.text("Aces per 100 Serve Points (→ More aggressive)", courtX + courtW / 2, axisY + 22);

      // Y-axis along left of court
      const axisX = courtX - 30;
      p.stroke(120);
      p.strokeWeight(1.5);
      p.line(axisX, courtY, axisX, courtY + courtH);

      const yTicks = 4;
      for (let i = 0; i <= yTicks; i++) {
        const val = domMin + (domMax - domMin) * (i / yTicks);
        const y = courtY + (1 - (val - domMin) / (domMax - domMin || 1)) * courtH;

        // tick
        p.line(axisX - 4, y, axisX, y);

        // label
        p.noStroke();
        p.textAlign(p.RIGHT, p.CENTER);
        p.text(val.toFixed(0) + "%", axisX - 6, y);
        p.stroke(120);
      }

      // Y-axis label
      p.noStroke();
      p.fill(30);
      p.textSize(11);
      p.textStyle(p.BOLD); 
      p.push();
      p.translate(axisX - 38, courtY + courtH / 2);
      p.rotate(-p.HALF_PI);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Serve Dominance % (↑ More effective)", 0, 0);
      p.pop();
    },

    drawCourtZones(p) {
      const { courtX, courtY, courtW, courtH } = this;

      // Zone labels
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(11);
      p.textStyle(p.ITALIC);
      
      // Left side (baseline): "Conservative Serving"
      p.fill(255, 255, 255, 200);
      p.text("BASELINE", courtX + 40, courtY + courtH / 2);
      p.textSize(9);
      p.text("(conservative)", courtX + 40, courtY + courtH / 2 + 14);

      // Right side (net): "Aggressive Serving"
      p.textSize(11);
      p.text("NET", courtX + courtW - 40, courtY + courtH / 2);
      p.textSize(9);
      p.text("(aggressive)", courtX + courtW - 40, courtY + courtH / 2 + 14);

      // Arrow showing direction of improvement – move it a bit up so text isn't cut off
      p.stroke(255, 255, 255, 160);
      p.strokeWeight(3);
      p.fill(255, 255, 255, 160);
      const arrowY = courtY + courtH - 32;   // was -15; raised so labels stay inside
      p.line(courtX + 60, arrowY, courtX + courtW - 60, arrowY);
      
      // Arrow head
      p.push();
      p.translate(courtX + courtW - 60, arrowY);
      p.noStroke();
      p.triangle(0, 0, -12, -6, -12, 6);
      p.pop();

      p.noStroke();
      p.textSize(10);
      p.textStyle(p.NORMAL);
      p.fill(255, 255, 255, 220);
      p.textAlign(p.CENTER, p.TOP);
    },

    drawBallTrajectories(p, currentYear) {
      for (let t of this.tours) {
        const data = this.series[t];
        const colorSet = this.colors[t];

        // Draw trail with gradient fade
        for (let i = 0; i < data.length - 1; i++) {
          const d1 = data[i];
          const d2 = data[i + 1];
          
          if (d2.year > currentYear) break;

          p.stroke(colorSet.trail);
          p.strokeWeight(4);
          p.line(d1.courtX, d1.courtY, d2.courtX, d2.courtY);
        }
      }
    },

    drawTennisBalls(p, currentYear) {
      for (let t of this.tours) {
        const data = this.series[t];
        const colorSet = this.colors[t];

        for (let i = 0; i < data.length; i++) {
          const d = data[i];
          if (d.year > currentYear) continue;

          const isFirst = (i === 0);
          const isCurrent = (d.year === currentYear);
          const isMilestone = (d.year % 5 === 0);

          const r = d.ballSize;

          if (isCurrent) {
            // Current year: animated glowing ball
            const pulse = 1 + 0.2 * Math.sin(p.millis() / 300);
            
            // Large glow
            p.noStroke();
            p.fill(colorSet.glow);
            p.circle(d.courtX, d.courtY, r * 5 * pulse);
            
            // Mid glow
            p.fill(colorSet.trail);
            p.circle(d.courtX, d.courtY, r * 3 * pulse);
          }

          // "Tennis ball" texture but in brand colors
          p.noStroke();
          p.fill(colorSet.main);
          p.circle(d.courtX, d.courtY, r * 2);

          // Ball seam (curved line)
          p.noFill();
          p.stroke(255, 255, 255, 190);
          p.strokeWeight(1.5);
          p.arc(d.courtX, d.courtY, r * 1.8, r * 1.8, -p.PI / 6, p.PI / 6);
          p.arc(d.courtX, d.courtY, r * 1.8, r * 1.8, p.PI * 5 / 6, p.PI * 7 / 6);

          // Highlight (makes it look 3D)
          p.noStroke();
          p.fill(255, 255, 255, 160);
          p.circle(d.courtX - r * 0.3, d.courtY - r * 0.3, r * 0.6);

          // Shadow under ball
          p.fill(0, 0, 0, 55);
          p.ellipse(d.courtX + 2, d.courtY + r + 2, r * 1.5, r * 0.4);

          // Year labels
          if (isFirst || isMilestone || isCurrent) {
            p.fill(colorSet.accent);
            p.textSize(isCurrent ? 13 : 10);
            p.textStyle(p.BOLD);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.noStroke();
            
            // White background for legibility
            const txtW = p.textWidth(d.year.toString()) + 6;
            p.fill(255, 240);
            p.rect(d.courtX - txtW / 2, d.courtY - r - 18, txtW, 14, 3);
            
            p.fill(colorSet.accent);
            p.text(d.year, d.courtX, d.courtY - r - 6);

            if (isCurrent) {
              // Show metrics
              p.textSize(9);
              p.textStyle(p.NORMAL);
              p.textAlign(p.CENTER, p.TOP);
              p.fill(colorSet.accent);
              p.text(`${d.aces.toFixed(1)} aces | ${d.dom.toFixed(1)}% dom`, d.courtX, d.courtY + r + 6);
            }
          }
        }
      }
    },

    handleHover(p) {
      const mx = p.mouseX - this.margin.left;
      const my = p.mouseY - this.margin.top;

      this.hoverPoint = null;
      let bestDist = 25;

      for (let t of this.tours) {
        const data = this.series[t];
        for (let d of data) {
          const dist = Math.sqrt((mx - d.courtX) ** 2 + (my - d.courtY) ** 2);
          if (dist < bestDist) {
            bestDist = dist;
            this.hoverPoint = { tour: t, ...d };
          }
        }
      }

      if (this.hoverPoint) {
        const pt = this.hoverPoint;
        const colorSet = this.colors[pt.tour];

        // Glow ring
        p.noFill();
        p.stroke(colorSet.accent);
        p.strokeWeight(3);
        p.circle(pt.courtX, pt.courtY, pt.ballSize * 3);

        // Tooltip
        const lines = [
          `${pt.tour} — ${pt.year}`,
          `Aggression: ${pt.aces.toFixed(2)} aces/100 pts`,
          `Effectiveness: ${pt.dom.toFixed(1)}% serve dominance`
        ];
        
        this.drawTooltip(p, pt.courtX, pt.courtY, lines, colorSet);
      }
    },

    drawTooltip(p, x, y, lines, colorSet) {
      const padding = 10;
      p.textSize(11);
      p.textStyle(p.NORMAL);
      
      let maxW = 0;
      for (let txt of lines) maxW = Math.max(maxW, p.textWidth(txt));
      
      const boxW = maxW + padding * 2;
      const boxH = lines.length * 16 + padding * 2;
      
      let boxX = x + 25;
      let boxY = y - boxH / 2;
      
      if (boxX + boxW > this.chartW) boxX = x - boxW - 25;
      if (boxY < 0) boxY = 5;
      if (boxY + boxH > this.chartH) boxY = this.chartH - boxH - 5;

      p.noStroke();
      p.fill(255, 250);
      p.rect(boxX, boxY, boxW, boxH, 8);
      
      p.stroke(colorSet.accent);
      p.strokeWeight(2);
      p.noFill();
      p.rect(boxX, boxY, boxW, boxH, 8);

      p.noStroke();
      p.textAlign(p.LEFT, p.TOP);
      let ty = boxY + padding;
      for (let i = 0; i < lines.length; i++) {
        if (i === 0) {
          p.fill(colorSet.accent);
          p.textStyle(p.BOLD);
        } else {
          p.fill(40);
          p.textStyle(p.NORMAL);
        }
        p.text(lines[i], boxX + padding, ty);
        ty += 16;
      }
    },

    drawTitle(p, currentYear) {
      p.noStroke();
      p.fill(20);
      p.textAlign(p.LEFT, p.BOTTOM);
      p.textSize(20);
      p.textStyle(p.BOLD);
      p.text("Serve Power Evolution Court", 0, -68);
      
      p.textSize(13);
      p.textStyle(p.NORMAL);
      p.fill(80);
      p.text("Ball position shows serving aggression; ball size shows effectiveness", 0, -48);

      // Year counter – slight x tweak so it doesn't overlap subtitle
      p.fill(255, 250);
      p.stroke(120);
      p.strokeWeight(1.5);
      const yearBoxX = this.chartW - 60;
      p.rect(yearBoxX, -78, 120, 35, 6);
      
      p.noStroke();
      p.fill(40);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(11);
      p.textStyle(p.NORMAL);
      p.text("SEASON", yearBoxX + 60, -68);
      
      p.textSize(20);
      p.textStyle(p.BOLD);
      p.text(currentYear, yearBoxX + 60, -53);
    },

    drawLegendBox(p) {
      const boxX = this.chartW + 20;
      const boxY = 10;
      const boxW = 200;
      const boxH = 200;

      p.fill(255, 252);
      p.stroke(180);
      p.strokeWeight(1.5);
      p.rect(boxX, boxY, boxW, boxH, 8);

      p.noStroke();
      p.fill(30);
      p.textSize(13);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.TOP);
      p.text("HOW TO READ", boxX + 12, boxY + 12);

      p.textStyle(p.NORMAL);
      p.textSize(10);
      p.fill(60);
      p.text("• Left to Right = More aggressive\n• Ball size = More effective\n• Path shows evolution", boxX + 12, boxY + 35);

      let yPos = boxY + 85;

      // ATP ball (now blue)
      p.fill(this.colors["ATP"].main);
      p.circle(boxX + 30, yPos, 16);
      p.noFill();
      p.stroke(255, 180);
      p.strokeWeight(1.5);
      p.arc(boxX + 30, yPos, 14, 14, -p.PI / 6, p.PI / 6);
      
      p.noStroke();
      p.fill(40);
      p.textSize(12);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.CENTER);
      p.text("ATP Tour", boxX + 50, yPos);
      
      p.textStyle(p.NORMAL);
      p.textSize(10);
      p.fill(100);
      p.text("Men's path (blue)", boxX + 50, yPos + 14);

      yPos += 50;

      // WTA ball (hot pink)
      p.fill(this.colors["WTA"].main);
      p.circle(boxX + 30, yPos, 16);
      p.noFill();
      p.stroke(255, 180);
      p.strokeWeight(1.5);
      p.arc(boxX + 30, yPos, 14, 14, -p.PI / 6, p.PI / 6);
      
      p.noStroke();
      p.fill(40);
      p.textSize(12);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.CENTER);
      p.text("WTA Tour", boxX + 50, yPos);
      
      p.textStyle(p.NORMAL);
      p.textSize(10);
      p.fill(100);
      p.text("Women's path (pink)", boxX + 50, yPos + 14);
    },

    drawPlayButton(p) {
      const btnX = this.chartW + 30;
      const btnY = 230;
      const btnW = 180;
      const btnH = 40;

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
      p.textSize(13);
      p.textStyle(p.BOLD);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(this.isPlaying ? "⏸ PLAYING..." : "▶ WATCH EVOLUTION", btnX + btnW / 2, btnY + btnH / 2);
    },

    handleClick(p) {
      const btnX = this.chartW + 30;
      const btnY = 230;
      const btnW = 180;
      const btnH = 40;

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
