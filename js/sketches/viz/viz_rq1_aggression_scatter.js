// viz_rq1_aggression_scatter.js
// RQ1B – Aggressive Serving vs Serve Dominance

(function () {
  const Viz = {
    table: null,
    initialized: false,

    margin: { top: 60, right: 160, bottom: 55, left: 80 },
    chartW: 0,
    chartH: 0,

    tours: ["ATP", "WTA"],
    colors: {},
    series: {},      // { ATP: [{year, x, y, aces, dom}], ... }

    hoverPoint: null,

    ensureInit(p) {
      if (this.initialized) return;

      this.chartW = p.width - this.margin.left - this.margin.right;
      this.chartH = p.height - this.margin.top - this.margin.bottom;

      this.colors["ATP"] = p.color(30, 115, 190);
      this.colors["WTA"] = p.color(188, 70, 155);

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
        const gender = this.table.getString(r, "gender");
        const aces100 = parseFloat(this.table.getString(r, "aces_per_100"));
        const domPct = parseFloat(this.table.getString(r, "serve_points_won_pct"));

        if (!year || isNaN(aces100) || isNaN(domPct)) continue;
        if (!(gender in byTour)) continue;

        byTour[gender].push({
          year,
          aces: aces100,
          dom: domPct
        });
      }

      // sort by year
      for (let t of this.tours) {
        byTour[t].sort((a, b) => a.year - b.year);
      }

      this.series = byTour;
    },

    draw(p, manager, ai, progress) {
      this.ensureInit(p);

      if (!this.table || Object.keys(this.series).length === 0) {
        p.background(245);
        p.fill(80);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(20);
        p.text("Loading serve aggression data…", 40, 40);
        return;
      }

      p.background(245);

      // find global ranges
      let xs = [], ys = [];
      for (let t of this.tours) {
        xs = xs.concat(this.series[t].map(d => d.aces));
        ys = ys.concat(this.series[t].map(d => d.dom));
      }
      let xMin = Math.min(...xs), xMax = Math.max(...xs);
      let yMin = Math.min(...ys), yMax = Math.max(...ys);
      const xPad = (xMax - xMin) * 0.08 || 0.2;
      const yPad = (yMax - yMin) * 0.08 || 0.2;
      xMin -= xPad; xMax += xPad;
      yMin -= yPad; yMax += yPad;

      p.push();
      p.translate(this.margin.left, this.margin.top);

      // axes + grid
      this.drawAxes(p, xMin, xMax, yMin, yMax);

      this.hoverPoint = null;
      let bestDist = 14;

      // draw trajectories
      for (let t of this.tours) {
        const data = this.series[t];
        if (!data.length) continue;

        const col = this.colors[t];

        // map positions
        for (let d of data) {
          d.x = p.map(d.aces, xMin, xMax, 0, this.chartW);
          d.y = p.map(d.dom, yMin, yMax, this.chartH, 0);
        }

        // path line (shows evolution over time)
        p.noFill();
        p.stroke(col);
        p.strokeWeight(2);
        p.beginShape();
        for (let d of data) {
          p.vertex(d.x, d.y);
        }
        p.endShape();

        // arrow head at most recent year
        const last = data[data.length - 1];
        p.push();
        p.translate(last.x, last.y);
        p.fill(col);
        p.noStroke();
        p.triangle(0, -6, -4, 4, 4, 4);
        p.pop();

        // points
        for (let d of data) {
          const r = (d.year % 5 === 0) ? 5 : 3;
          const dist = p.dist(
            p.mouseX - this.margin.left,
            p.mouseY - this.margin.top,
            d.x, d.y
          );
          if (dist < bestDist) {
            bestDist = dist;
            this.hoverPoint = { tour: t, ...d };
          }

          p.noStroke();
          p.fill(col);
          p.ellipse(d.x, d.y, r * 2, r * 2);

          // label decade anchor years mildly
          if (d.year === 2000 || d.year === 2010 || d.year === 2020) {
            p.fill(60);
            p.textSize(10);
            p.textAlign(p.LEFT, p.CENTER);
            p.text(d.year, d.x + 4, d.y - 8);
          }
        }
      }

      // highlight hovered point
      if (this.hoverPoint) {
        p.noStroke();
        p.fill(255, 245);
        p.ellipse(this.hoverPoint.x, this.hoverPoint.y, 14, 14);

        p.fill(this.colors[this.hoverPoint.tour]);
        p.ellipse(this.hoverPoint.x, this.hoverPoint.y, 9, 9);

        const lines = [
          `${this.hoverPoint.tour} – ${this.hoverPoint.year}`,
          `Aces per 100 serve points: ${this.hoverPoint.aces.toFixed(2)}`,
          `Serve dominance: ${this.hoverPoint.dom.toFixed(2)}%`
        ];
        this.drawTooltip(
          p,
          this.hoverPoint.x + this.margin.left,
          this.hoverPoint.y + this.margin.top - 10,
          lines
        );
      }

      // title
      p.noStroke();
      p.fill(20);
      p.textAlign(p.LEFT, p.BOTTOM);
      p.textSize(20);
      p.text("RQ1B – Aggressive Serving vs Serve Dominance", 0, -20);

      this.drawLegend(p);

      p.pop();
    },

    drawAxes(p, xMin, xMax, yMin, yMax) {
      p.stroke(210);
      p.strokeWeight(1);
      p.fill(80);
      p.textSize(11);

      // x-axis (aces)
      p.line(0, this.chartH, this.chartW, this.chartH);
      p.textAlign(p.CENTER, p.TOP);

      const xticks = 5;
      for (let i = 0; i <= xticks; i++) {
        const v = p.map(i, 0, xticks, xMin, xMax);
        const x = p.map(v, xMin, xMax, 0, this.chartW);
        p.line(x, this.chartH, x, this.chartH + 4);
        p.noStroke();
        p.text(v.toFixed(1), x, this.chartH + 8);
        p.stroke(235);
        p.line(x, 0, x, this.chartH);
        p.stroke(210);
      }

      // y-axis (dominance)
      p.line(0, 0, 0, this.chartH);
      p.textAlign(p.RIGHT, p.CENTER);

      const yticks = 5;
      for (let i = 0; i <= yticks; i++) {
        const v = p.map(i, 0, yticks, yMax, yMin);
        const y = p.map(v, yMin, yMax, this.chartH, 0);
        p.line(-4, y, 0, y);
        p.noStroke();
        p.text(v.toFixed(1) + "%", -8, y);
        p.stroke(235);
        p.line(0, y, this.chartW, y);
        p.stroke(210);
      }

      // labels
      p.noStroke();
      p.textAlign(p.CENTER, p.TOP);
      p.text("Aces per 100 serve points", this.chartW / 2, this.chartH + 32);

      p.push();
      p.translate(-60, this.chartH / 2);
      p.rotate(-p.HALF_PI);
      p.text("Serve dominance (% of points won on serve)", 0, 0);
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
        p.text(`${t} (yearly points)`, x0 + 18, yy);
        yy += 18;
      }

      p.fill(90);
      p.text(
        "Lines show how tours move\nthrough aces vs dominance space\nover time.\nHover a point for details.",
        x0, yy + 6
      );
    },

    drawTooltip(p, sx, sy, lines) {
      const padding = 6;
      p.textSize(11);
      let w = 0;
      for (let t of lines) w = Math.max(w, p.textWidth(t));
      const h = lines.length * 14;

      let x = sx + 12;
      let y = sy - h - 18;
      if (x + w + padding * 2 > p.width) x = p.width - w - padding * 2 - 5;
      if (y < 10) y = sy + 10;

      p.noStroke();
      p.fill(255, 245);
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

  window.VizRQ1_AggScatter = Viz;
})();
