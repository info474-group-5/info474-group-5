// viz_rq1_aces_trend.js
// RQ1A – Aces per Match Over Time: Enhanced interactive visualization

(function () {
  const Viz = {
    table: null,
    initialized: false,

    margin: { top: 90, right: 220, bottom: 70, left: 90 },
    chartW: 0,
    chartH: 0,

    years: [],
    tours: ["ATP", "WTA"],
    colors: {},
    series: {}, // { ATP: [{ year, value, x, y }], WTA: [...] }

    xScale: null,
    yScale: null,
    
    // Interactive state
    isPlaying: false,
    playStartTime: null,
    playDuration: 4000, // 4 seconds to animate through all years

    ensureInit(p) {
      if (this.initialized) return;

      this.chartW = p.width - this.margin.left - this.margin.right;
      this.chartH = p.height - this.margin.top - this.margin.bottom;

      // Bolder, more saturated colors with distinct personalities
      this.colors["ATP"] = {
        main: p.color(20, 90, 180, 255),
        light: p.color(80, 150, 230, 180),
        glow: p.color(20, 90, 180, 80)
      };
      this.colors["WTA"] = {
        main: p.color(220, 30, 140, 255),
        light: p.color(255, 80, 180, 180),
        glow: p.color(220, 30, 140, 80)
      };

      this.table = p.loadTable(
        "data/processed/rqx_aces_by_year.csv",
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

      const yearsSet = new Set();
      const byTour = { ATP: [], WTA: [] };

      for (let r = 0; r < this.table.getRowCount(); r++) {
        const year = parseInt(this.table.getString(r, "year"));
        const tour = this.table.getString(r, "tour");
        const aces = parseFloat(this.table.getString(r, "aces_per_match"));

        if (!year || isNaN(aces)) continue;
        if (!(tour in byTour)) continue;

        yearsSet.add(year);
        byTour[tour].push({ year, value: aces });
      }

      this.years = Array.from(yearsSet).sort((a, b) => a - b);

      for (let t of this.tours) {
        byTour[t].sort((a, b) => a.year - b.year);
      }

      this.series = byTour;
      
      // Compute scales
      this.computeScales();
    },

    computeScales() {
      if (!this.years.length) return;

      // Collect all values for y-axis domain
      let allVals = [];
      for (let t of this.tours) {
        allVals = allVals.concat(this.series[t].map(d => d.value));
      }

      const yMin = Math.floor(Math.min(...allVals)) - 1;
      const yMax = Math.ceil(Math.max(...allVals)) + 1;

      // Create scale functions
      const xMin = this.years[0];
      const xMax = this.years[this.years.length - 1];

      this.xScale = {
        min: xMin,
        max: xMax,
        toPixel: (year) => {
          const t = (year - xMin) / (xMax - xMin || 1);
          return t * this.chartW;
        }
      };

      this.yScale = {
        min: yMin,
        max: yMax,
        toPixel: (value) => {
          const t = (value - yMin) / (yMax - yMin || 1);
          return this.chartH - t * this.chartH; // invert Y
        }
      };

      // Precompute pixel positions
      for (let t of this.tours) {
        for (let d of this.series[t]) {
          d.x = this.xScale.toPixel(d.year);
          d.y = this.yScale.toPixel(d.value);
        }
      }
    },

    draw(p, manager, ai, progress) {
      this.ensureInit(p);

      if (!this.table || !this.years.length) {
        p.background(250);
        p.fill(80);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(20);
        p.text("Loading aces data…", 40, 40);
        return;
      }

      p.background(252);

      p.push();
      p.translate(this.margin.left, this.margin.top);

      // Tennis-themed background (darker green)
      this.drawBackground(p);

      // Determine revealed year
      let revealIdx = 0;
      
      if (this.isPlaying) {
        // Auto-play animation
        const elapsed = p.millis() - this.playStartTime;
        const t = Math.min(1, elapsed / this.playDuration);
        revealIdx = Math.round(t * this.years.length);
        
        if (t >= 1) {
          this.isPlaying = false; // Stop when complete
        }
      } else {
        // Scroll-based reveal starting from 2003 (WTA data begins)
        revealIdx = Math.round(p.constrain(progress * this.years.length, 0, this.years.length));
      }

      const currentYear = revealIdx < this.years.length ? this.years[revealIdx] : this.years[this.years.length - 1];

      // Draw axes
      this.drawAxes(p);

      // Draw trend lines progressively
      this.drawTrendLines(p, revealIdx, currentYear);

      // Draw data points
      this.drawDataPoints(p, revealIdx, currentYear);

      // Highlight current year
      this.drawYearHighlight(p, currentYear);

      // Show current values with glowing balls
      this.drawCurrentValues(p, currentYear);

      // Title and year counter
      this.drawTitle(p, currentYear);
      
      // Legend box
      this.drawLegendBox(p);

      // Play button
      this.drawPlayButton(p);

      p.pop();
    },

    drawBackground(p) {
      // Darker tennis court green gradient background
      p.noStroke();
      for (let i = 0; i < this.chartH; i += 3) {
        const t = i / this.chartH;
        const c = p.lerpColor(
          p.color(225, 240, 228),
          p.color(200, 225, 205),
          t
        );
        p.fill(c);
        p.rect(0, i, this.chartW, 3);
      }

      // Subtle court lines
      p.stroke(185, 210, 190);
      p.strokeWeight(1);
      // Net line
      p.line(0, this.chartH / 2, this.chartW, this.chartH / 2);
      // Service lines
      p.line(0, this.chartH / 4, this.chartW, this.chartH / 4);
      p.line(0, (3 * this.chartH) / 4, this.chartW, (3 * this.chartH) / 4);
    },

    drawAxes(p) {
      p.stroke(70);
      p.strokeWeight(2.5);
      p.line(0, this.chartH, this.chartW, this.chartH); // x-axis
      p.line(0, 0, 0, this.chartH); // y-axis

      p.textSize(12);
      p.fill(50);
      p.textStyle(p.NORMAL);

      // X-axis labels (years)
      p.textAlign(p.CENTER, p.TOP);
      const yearStep = 2; // Show every 2 years
      for (let i = 0; i < this.years.length; i += yearStep) {
        const year = this.years[i];
        const x = this.xScale.toPixel(year);
        p.noStroke();
        p.text(year, x, this.chartH + 10);
        p.stroke(160);
        p.strokeWeight(1);
        p.line(x, this.chartH, x, this.chartH + 5);
      }

      // Y-axis labels (aces per match)
      p.textAlign(p.RIGHT, p.CENTER);
      const yTicks = 6;
      for (let i = 0; i <= yTicks; i++) {
        const val = p.lerp(this.yScale.min, this.yScale.max, i / yTicks);
        const y = this.yScale.toPixel(val);
        p.noStroke();
        p.text(val.toFixed(1), -10, y);
        p.stroke(210);
        p.strokeWeight(0.5);
        p.line(0, y, this.chartW, y);
      }

      // Axis labels (bold)
      p.noStroke();
      p.fill(30);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(14);
      p.textStyle(p.BOLD);
      p.text("Year", this.chartW / 2, this.chartH + 42);

      p.push();
      p.translate(-60, this.chartH / 2);
      p.rotate(-p.HALF_PI);
      p.text("Aces per Match", 0, 0);
      p.pop();
    },

    drawTrendLines(p, revealIdx, currentYear) {
      // Draw lines with gradient fade effect
      for (let t of this.tours) {
        const data = this.series[t];
        const colorSet = this.colors[t];

        // Shadow/glow effect
        p.noFill();
        p.stroke(colorSet.glow);
        p.strokeWeight(8);
        p.beginShape();
        for (let d of data) {
          if (d.year <= currentYear) {
            p.vertex(d.x, d.y);
          }
        }
        p.endShape();

        // Main line
        p.stroke(colorSet.main);
        p.strokeWeight(4);
        p.beginShape();
        for (let d of data) {
          if (d.year <= currentYear) {
            p.vertex(d.x, d.y);
          }
        }
        p.endShape();

        // Distinctive pattern: ATP solid, WTA dashed
        if (t === "WTA") {
          p.drawingContext.setLineDash([8, 4]);
          p.stroke(colorSet.light);
          p.strokeWeight(3);
          p.beginShape();
          for (let d of data) {
            if (d.year <= currentYear) {
              p.vertex(d.x, d.y);
            }
          }
          p.endShape();
          p.drawingContext.setLineDash([]);
        }
      }
    },

    drawDataPoints(p, revealIdx, currentYear) {
      for (let t of this.tours) {
        const data = this.series[t];
        const colorSet = this.colors[t];

        for (let d of data) {
          if (d.year <= currentYear) {
            // Outer glow
            p.noStroke();
            p.fill(colorSet.glow);
            const r = (d.year % 5 === 0) ? 10 : 7;
            p.circle(d.x, d.y, r * 2.5);

            // Main dot
            p.fill(colorSet.main);
            p.circle(d.x, d.y, r * 2);

            // White center
            p.fill(255);
            p.circle(d.x, d.y, r * 0.8);

            // Label milestone years
            if (d.year % 5 === 0 && d.year !== currentYear) {
              p.fill(colorSet.main);
              p.textSize(9);
              p.textAlign(p.CENTER, p.BOTTOM);
              p.text(d.year, d.x, d.y - 14);
            }
          }
        }
      }
    },

    drawYearHighlight(p, currentYear) {
      // Vertical line at current year
      const x = this.xScale.toPixel(currentYear);
      
      p.stroke(100, 150);
      p.strokeWeight(2);
      p.drawingContext.setLineDash([5, 5]);
      p.line(x, 0, x, this.chartH);
      p.drawingContext.setLineDash([]);
    },

    drawCurrentValues(p, currentYear) {
      const pulse = 1 + 0.12 * Math.sin(p.millis() / 350);

      for (let t of this.tours) {
        const data = this.series[t];
        const currentData = data.find(d => d.year === currentYear);
        
        if (currentData) {
          const colorSet = this.colors[t];
          
          // Large glowing halo
          p.noStroke();
          p.fill(colorSet.glow);
          p.circle(currentData.x, currentData.y, 40 * pulse);
          
          // Mid glow
          p.fill(colorSet.light);
          p.circle(currentData.x, currentData.y, 26 * pulse);
          
          // Main ball
          p.fill(colorSet.main);
          p.circle(currentData.x, currentData.y, 18 * pulse);
          
          // Bright center
          p.fill(255);
          p.circle(currentData.x, currentData.y, 7);

          // Value label with background
          const yOffset = t === "ATP" ? -45 : 45;
          const labelY = currentData.y + yOffset;
          
          p.fill(255, 250);
          p.noStroke();
          p.rect(currentData.x - 35, labelY - 10, 70, 20, 4);
          
          p.fill(colorSet.main);
          p.textSize(13);
          p.textStyle(p.BOLD);
          p.textAlign(p.CENTER, p.CENTER);
          p.text(`${currentData.value.toFixed(2)}`, currentData.x, labelY);
        }
      }
    },

    drawTitle(p, currentYear) {
      // Title
      p.noStroke();
      p.fill(20);
      p.textAlign(p.LEFT, p.BOTTOM);
      p.textSize(20);
      p.textStyle(p.BOLD);
      p.text("Aces per Match Over Time", 0, -58);
      
      p.textSize(13);
      p.textStyle(p.NORMAL);
      p.fill(80);
      p.text("Evolution of serving power: ATP vs WTA (2000-2024)", 0, -38);

      // Year counter - styled box on the right
      p.fill(255, 250);
      p.stroke(120);
      p.strokeWeight(1.5);
      const yearBoxX = this.chartW - 120;
      p.rect(yearBoxX, -70, 120, 35, 6);
      
      p.noStroke();
      p.fill(40);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(11);
      p.textStyle(p.NORMAL);
      p.text("CURRENT YEAR", yearBoxX + 60, -60);
      
      p.textSize(20);
      p.textStyle(p.BOLD);
      p.fill(20);
      p.text(currentYear, yearBoxX + 60, -45);
    },

    drawLegendBox(p) {
      const boxX = this.chartW + 20;
      const boxY = 10;
      const boxW = 180;
      const boxH = 140;

      // Legend background box
      p.fill(255, 252);
      p.stroke(180);
      p.strokeWeight(1.5);
      p.rect(boxX, boxY, boxW, boxH, 8);

      // Legend title
      p.noStroke();
      p.fill(30);
      p.textSize(13);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.TOP);
      p.text("LEGEND", boxX + 12, boxY + 12);

      let yPos = boxY + 38;

      // ATP entry
      p.stroke(this.colors["ATP"].main);
      p.strokeWeight(4);
      p.line(boxX + 15, yPos, boxX + 45, yPos);
      
      p.noStroke();
      p.fill(this.colors["ATP"].main);
      p.circle(boxX + 30, yPos, 10);
      p.fill(255);
      p.circle(boxX + 30, yPos, 4);
      
      p.fill(40);
      p.textSize(12);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.CENTER);
      p.text("ATP Tour", boxX + 55, yPos);
      
      p.textStyle(p.NORMAL);
      p.textSize(10);
      p.fill(100);
      p.text("Men's professional", boxX + 55, yPos + 14);

      yPos += 45;

      // WTA entry with dashed line
      p.drawingContext.setLineDash([6, 3]);
      p.stroke(this.colors["WTA"].main);
      p.strokeWeight(4);
      p.line(boxX + 15, yPos, boxX + 45, yPos);
      p.drawingContext.setLineDash([]);
      
      p.noStroke();
      p.fill(this.colors["WTA"].main);
      p.circle(boxX + 30, yPos, 10);
      p.fill(255);
      p.circle(boxX + 30, yPos, 4);
      
      p.fill(40);
      p.textSize(12);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.CENTER);
      p.text("WTA Tour", boxX + 55, yPos);
      
      p.textStyle(p.NORMAL);
      p.textSize(10);
      p.fill(100);
      p.text("Women's professional", boxX + 55, yPos + 14);
    },

    drawPlayButton(p) {
      const btnX = this.chartW + 30;
      const btnY = 170;
      const btnW = 160;
      const btnH = 40;

      // Check hover
      const mx = p.mouseX - this.margin.left;
      const my = p.mouseY - this.margin.top;
      const isHover = mx > btnX && mx < btnX + btnW && my > btnY && my < btnY + btnH;

      // Button background
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

      // Button text
      p.noStroke();
      p.fill(isHover ? 30 : 60);
      p.textSize(13);
      p.textStyle(p.BOLD);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(this.isPlaying ? "⏸ PLAYING..." : "▶ PLAY FROM 2000", btnX + btnW / 2, btnY + btnH / 2);
    },

    handleClick(p) {
      const btnX = this.chartW + 30;
      const btnY = 170;
      const btnW = 160;
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

  window.VizRQ1_AcesTrend = Viz;
})();
