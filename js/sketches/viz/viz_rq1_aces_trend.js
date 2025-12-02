// viz_rq1_aces_trend.js
// RQ1A – Aces per Match Over Time: Clear trend visualization with tennis aesthetic

(function () {
  const Viz = {
    table: null,
    initialized: false,

    margin: { top: 80, right: 40, bottom: 60, left: 80 },
    chartW: 0,
    chartH: 0,

    years: [],
    tours: ["ATP", "WTA"],
    colors: {},
    series: {}, // { ATP: [{ year, value, x, y }], WTA: [...] }

    hoverYear: null,
    xScale: null,
    yScale: null,

    ensureInit(p) {
      if (this.initialized) return;

      this.chartW = p.width - this.margin.left - this.margin.right;
      this.chartH = p.height - this.margin.top - this.margin.bottom;

      // More saturated, visible colors
      this.colors["ATP"] = p.color(30, 115, 190, 255);
      this.colors["WTA"] = p.color(220, 50, 150, 255);

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

      const yMin = Math.floor(Math.min(...allVals));
      const yMax = Math.ceil(Math.max(...allVals));

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

      p.background(250);

      p.push();
      p.translate(this.margin.left, this.margin.top);

      // Tennis-themed background
      this.drawBackground(p);

      // Determine revealed year based on scroll progress
      const revealIdx = Math.round(
        p.constrain(progress * this.years.length, 0, this.years.length)
      );

      // Draw axes
      this.drawAxes(p);

      // Draw trend lines progressively
      this.drawTrendLines(p, revealIdx);

      // Draw data points
      this.drawDataPoints(p, revealIdx);

      // Show current values
      this.drawCurrentValues(p, revealIdx);

      // Title and legend
      this.drawTitleLegend(p);

      p.pop();
    },

    drawBackground(p) {
      // Subtle tennis court green gradient background
      p.noStroke();
      for (let i = 0; i < this.chartH; i += 4) {
        const t = i / this.chartH;
        const c = p.lerpColor(
          p.color(245, 250, 245),
          p.color(230, 245, 235),
          t
        );
        p.fill(c);
        p.rect(0, i, this.chartW, 4);
      }

      // Subtle net line in middle
      p.stroke(200, 220, 200);
      p.strokeWeight(1);
      p.line(0, this.chartH / 2, this.chartW, this.chartH / 2);
    },

    drawAxes(p) {
      p.stroke(100);
      p.strokeWeight(2);
      p.line(0, this.chartH, this.chartW, this.chartH); // x-axis
      p.line(0, 0, 0, this.chartH); // y-axis

      p.textSize(11);
      p.fill(60);

      // X-axis labels (years)
      p.textAlign(p.CENTER, p.TOP);
      const yearStep = Math.max(1, Math.floor(this.years.length / 8));
      for (let i = 0; i < this.years.length; i += yearStep) {
        const year = this.years[i];
        const x = this.xScale.toPixel(year);
        p.noStroke();
        p.text(year, x, this.chartH + 8);
        p.stroke(180);
        p.strokeWeight(1);
        p.line(x, this.chartH, x, this.chartH + 4);
      }

      // Y-axis labels (aces per match)
      p.textAlign(p.RIGHT, p.CENTER);
      const yTicks = 6;
      for (let i = 0; i <= yTicks; i++) {
        const val = p.lerp(this.yScale.min, this.yScale.max, i / yTicks);
        const y = this.yScale.toPixel(val);
        p.noStroke();
        p.text(val.toFixed(1), -8, y);
        p.stroke(220);
        p.strokeWeight(1);
        p.line(0, y, this.chartW, y);
      }

      // Axis labels
      p.noStroke();
      p.fill(40);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(13);
      p.text("Year", this.chartW / 2, this.chartH + 36);

      p.push();
      p.translate(-55, this.chartH / 2);
      p.rotate(-p.HALF_PI);
      p.text("Aces per Match", 0, 0);
      p.pop();
    },

    drawTrendLines(p, revealIdx) {
      const revealYear = revealIdx < this.years.length ? this.years[revealIdx] : this.years[this.years.length - 1];

      for (let t of this.tours) {
        const data = this.series[t];
        const col = this.colors[t];

        p.noFill();
        p.stroke(col);
        p.strokeWeight(3);

        p.beginShape();
        for (let d of data) {
          if (d.year <= revealYear) {
            p.vertex(d.x, d.y);
          }
        }
        p.endShape();
      }
    },

    drawDataPoints(p, revealIdx) {
      const revealYear = revealIdx < this.years.length ? this.years[revealIdx] : this.years[this.years.length - 1];

      for (let t of this.tours) {
        const data = this.series[t];
        const col = this.colors[t];

        for (let d of data) {
          if (d.year <= revealYear) {
            // Stronger fill for visibility
            p.noStroke();
            p.fill(col);
            
            // Larger dots for key years
            const r = (d.year % 5 === 0) ? 7 : 5;
            p.circle(d.x, d.y, r * 2);

            // White center for contrast
            p.fill(255);
            p.circle(d.x, d.y, r);
          }
        }
      }
    },

    drawCurrentValues(p, revealIdx) {
      if (revealIdx === 0) return;

      const currentYear = revealIdx < this.years.length ? this.years[revealIdx] : this.years[this.years.length - 1];

      // Draw animated "serve ball" at current year position
      const pulse = 1 + 0.15 * Math.sin(p.millis() / 400);

      for (let t of this.tours) {
        const data = this.series[t];
        const currentData = data.find(d => d.year === currentYear);
        
        if (currentData) {
          const col = this.colors[t];
          
          // Glowing ball effect
          p.noStroke();
          p.fill(p.red(col), p.green(col), p.blue(col), 60);
          p.circle(currentData.x, currentData.y, 24 * pulse);
          
          p.fill(col);
          p.circle(currentData.x, currentData.y, 16 * pulse);
          
          p.fill(255);
          p.circle(currentData.x, currentData.y, 6);

          // Label with current value
          p.fill(col);
          p.textSize(14);
          p.textAlign(p.CENTER, t === "ATP" ? p.BOTTOM : p.TOP);
          const yOffset = t === "ATP" ? -25 : 25;
          p.text(`${t}: ${currentData.value.toFixed(2)}`, currentData.x, currentData.y + yOffset);
        }
      }

      // Year indicator
      p.fill(40);
      p.textSize(16);
      p.textAlign(p.CENTER, p.TOP);
      p.text(`Year: ${currentYear}`, this.chartW / 2, -60);
    },

    drawTitleLegend(p) {
      // Title
      p.noStroke();
      p.fill(20);
      p.textAlign(p.LEFT, p.BOTTOM);
      p.textSize(18);
      p.text("RQ1A – Aces per Match Over Time", 0, -60);

      // Legend
      p.textSize(12);
      p.textAlign(p.LEFT, p.CENTER);
      
      let legendX = this.chartW - 180;
      let legendY = 20;

      for (let t of this.tours) {
        const col = this.colors[t];
        
        // Color swatch
        p.fill(col);
        p.circle(legendX, legendY, 10);
        
        // Label
        p.fill(40);
        p.text(`${t} Tour`, legendX + 15, legendY);
        
        legendY += 20;
      }

      // Trend annotation
      p.fill(80);
      p.textSize(11);
      p.textAlign(p.LEFT, p.TOP);
      p.text("Both tours show steady\nincreases in serving power", legendX, legendY + 10);
    }
  };

  window.VizRQ1_AcesTrend = Viz;
})();
