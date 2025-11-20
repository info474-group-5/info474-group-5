// viz_rq1_aces_trend.js
// RQ1A – Aces per Match Over Time (ATP vs WTA)

(function () {
  const Viz = {
    table: null,
    initialized: false,

    margin: { top: 60, right: 140, bottom: 50, left: 70 },
    chartW: 0,
    chartH: 0,

    years: [],
    series: {},       // { ATP: [{year, value, x, y}], WTA: [...] }
    tours: ["ATP", "WTA"],
    colors: {},

    hoverYear: null,

    ensureInit(p) {
      if (this.initialized) return;

      this.chartW = p.width - this.margin.left - this.margin.right;
      this.chartH = p.height - this.margin.top - this.margin.bottom;

      this.colors["ATP"] = p.color(30, 115, 190);
      this.colors["WTA"] = p.color(188, 70, 155);

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
        const gender = this.table.getString(r, "gender");
        const aces = parseFloat(this.table.getString(r, "aces_per_match"));

        if (!year || isNaN(aces)) continue;
        if (!(gender in byTour)) continue;

        yearsSet.add(year);
        byTour[gender].push({ year, value: aces });
      }

      this.years = Array.from(yearsSet).sort((a, b) => a - b);

      // sort each tour by year
      for (let t of this.tours) {
        byTour[t].sort((a, b) => a.year - b.year);
      }

      this.series = byTour;
    },

    draw(p, manager, ai, progress) {
      this.ensureInit(p);

      if (!this.table || this.years.length === 0) {
        p.background(245);
        p.fill(80);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(20);
        p.text("Loading aces data…", 40, 40);
        return;
      }

      p.background(245);

      const yearMin = Math.min(...this.years);
      const yearMax = Math.max(...this.years);

      // y-scale – look across both tours
      let allVals = [];
      for (let t of this.tours) {
        allVals = allVals.concat(this.series[t].map(d => d.value));
      }
      const vMin = Math.min(...allVals);
      const vMax = Math.max(...allVals);
      const padding = (vMax - vMin) * 0.12 || 1;

      p.push();
      p.translate(this.margin.left, this.margin.top);

      // axes + grid
      this.drawAxes(p, yearMin, yearMax, vMin - padding, vMax + padding);

      // pre-compute x positions per year (for hover)
      const yearToX = {};
      for (let y of this.years) {
        yearToX[y] = p.map(y, yearMin, yearMax, 0, this.chartW);
      }

      this.hoverYear = null;
      let closestDist = 12;

      // draw each tour line + points
      for (let t of this.tours) {
        const data = this.series[t];
        if (!data.length) continue;

        const col = this.colors[t];

        // line
        p.noFill();
        p.stroke(col);
        p.strokeWeight(2);
        p.beginShape();
        for (let d of data) {
          const x = yearToX[d.year];
          const y = p.map(d.value, vMin - padding, vMax + padding, this.chartH, 0);
          d.x = x;
          d.y = y;
          p.vertex(x, y);
        }
        p.endShape();

        // points + hover detection
        p.noStroke();
        for (let d of data) {
          const x = d.x;
          const y = d.y;
          const r = 4;

          const dist = p.dist(p.mouseX - this.margin.left, p.mouseY - this.margin.top, x, y);
          if (dist < closestDist) {
            closestDist = dist;
            this.hoverYear = d.year;
          }

          p.fill(col);
          p.ellipse(x, y, r * 2, r * 2);
        }
      }

      // vertical hover band + tooltip comparing both tours
      if (this.hoverYear !== null) {
        const hx = yearToX[this.hoverYear];
        p.stroke(200);
        p.strokeWeight(1);
        p.line(hx, 0, hx, this.chartH);

        // gather info for that year
        const lines = [`Year ${this.hoverYear}`];
        for (let t of this.tours) {
          const d = this.series[t].find(d => d.year === this.hoverYear);
          if (d) {
            lines.push(`${t}: ${d.value.toFixed(2)} aces / match`);
          }
        }

        this.drawTooltip(p,
          hx + this.margin.left,
          this.margin.top + 20,
          lines
        );
      }

      // title
      p.noStroke();
      p.fill(20);
      p.textAlign(p.LEFT, p.BOTTOM);
      p.textSize(20);
      p.text("RQ1A – Aces per Match Over Time (ATP vs WTA)", 0, -20);

      // legend
      this.drawLegend(p);

      p.pop();
    },

    drawAxes(p, yearMin, yearMax, vMin, vMax) {
      p.stroke(210);
      p.strokeWeight(1);
      p.fill(80);
      p.textSize(11);
      p.textAlign(p.CENTER, p.TOP);

      // x-axis
      p.line(0, this.chartH, this.chartW, this.chartH);
      const step = Math.max(2, Math.round((yearMax - yearMin) / 8));
      for (let y = yearMin; y <= yearMax; y += step) {
        const x = p.map(y, yearMin, yearMax, 0, this.chartW);
        p.line(x, this.chartH, x, this.chartH + 4);
        p.noStroke();
        p.text(y, x, this.chartH + 8);
        p.stroke(235);
        p.line(x, 0, x, this.chartH);
        p.stroke(210);
      }

      // y-axis
      p.textAlign(p.RIGHT, p.CENTER);
      p.line(0, 0, 0, this.chartH);

      const ticks = 6;
      for (let i = 0; i <= ticks; i++) {
        const val = p.map(i, 0, ticks, vMax, vMin);
        const y = p.map(val, vMin, vMax, this.chartH, 0);
        p.line(-4, y, 0, y);
        p.noStroke();
        p.text(val.toFixed(1), -8, y);
        p.stroke(235);
        p.line(0, y, this.chartW, y);
        p.stroke(210);
      }

      // labels
      p.noStroke();
      p.textAlign(p.CENTER, p.TOP);
      p.text("Year", this.chartW / 2, this.chartH + 30);

      p.push();
      p.translate(-50, this.chartH / 2);
      p.rotate(-p.HALF_PI);
      p.text("Aces per match (tour average)", 0, 0);
      p.pop();
    },

    drawLegend(p) {
      const x0 = this.chartW + 20;
      const y0 = 10;

      p.textAlign(p.LEFT, p.TOP);
      p.textSize(11);
      p.noStroke();
      p.fill(40);
      p.text("Tour", x0, y0);

      let yy = y0 + 16;
      for (let t of this.tours) {
        p.fill(this.colors[t]);
        p.ellipse(x0 + 6, yy + 6, 10, 10);
        p.fill(40);
        p.text(t, x0 + 18, yy);
        yy += 18;
      }

      p.fill(90);
      p.text("Dots = yearly averages\nHover to compare ATP vs WTA", x0, yy + 4);
    },

    drawTooltip(p, sx, sy, lines) {
      const padding = 6;
      p.textSize(11);
      let w = 0;
      for (let t of lines) w = Math.max(w, p.textWidth(t));
      const h = lines.length * 14;

      let x = sx + 12;
      let y = sy;
      if (x + w + padding * 2 > p.width) x = p.width - w - padding * 2 - 5;

      p.noStroke();
      p.fill(255, 240);
      p.rect(x, y, w + padding * 2, h + padding * 2, 6);

      p.fill(30);
      p.textAlign(p.LEFT, p.TOP);
      let ty = y + padding;
      for (let t of lines) {
        p.text(t, x + padding, ty);
        ty += 14;
      }
    }
  };

  window.VizRQ1_AcesTrend = Viz;
})();
