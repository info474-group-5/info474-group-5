// viz_rq1_pace_speed.js
(function () {
    const Viz = {
        _loading: false,
        _ready: false,
        _years: [],
        _minutes: [],
        _speeds: [],
        _minSpeed: null,
        _maxSpeed: null,
        _minMinutes: null,
        _maxMinutes: null,

        _loadData: function (p) {
            this._loading = true;

            p.loadTable(
                "data/processed/rq1_yearly_pace.csv",
                "header",
                (table) => {
                    const years = [];
                    const minutes = [];
                    const speeds = [];

                    for (let r = 0; r < table.getRowCount(); r++) {
                        const y = table.getNum(r, "year");
                        const m = table.getNum(r, "minutes");
                        const s = table.getNum(r, "Speed_MPH");

                        if (!isNaN(y) && !isNaN(m) && !isNaN(s)) {
                            years.push(y);
                            minutes.push(m);
                            speeds.push(s);
                        }
                    }

                    if (years.length === 0) {
                        console.warn("RQ1B: no valid rows in rq1_yearly_pace.csv");
                        this._loading = false;
                        this._ready = false;
                        return;
                    }

                    this._years = years;
                    this._minutes = minutes;
                    this._speeds = speeds;

                    this._minSpeed = Math.min(...speeds);
                    this._maxSpeed = Math.max(...speeds);
                    this._minMinutes = Math.min(...minutes);
                    this._maxMinutes = Math.max(...minutes);

                    this._loading = false;
                    this._ready = true;
                },
                (err) => {
                    console.error("Error loading rq1_yearly_pace.csv for RQ1B", err);
                    this._loading = false;
                    this._ready = false;
                }
            );
        },

        draw: function (p, manager, ai, progress) {
            if (!this._loading && !this._ready) {
                this._loadData(p);
            }

            p.background(240);
            p.fill(0);
            p.textSize(14);

            if (this._loading) {
                p.text("Loading RQ1B data…", 50, 200);
                return;
            }

            if (!this._ready) {
                p.text("No RQ1B data available.", 50, 200);
                return;
            }

            const marginLeft = 70;
            const marginRight = 40;
            const marginTop = 50;
            const marginBottom = 60;

            const plotW = p.width - marginLeft - marginRight;
            const plotH = p.height - marginTop - marginBottom;

            const originX = marginLeft;
            const originY = p.height - marginBottom;

            // axes
            p.stroke(0);
            p.strokeWeight(1);
            // x
            p.line(originX, originY, originX + plotW, originY);
            // y
            p.line(originX, originY, originX, originY - plotH);

            // labels
            p.noStroke();
            p.textSize(12);
            p.textAlign(p.CENTER, p.TOP);
            p.text("Average Serve Speed (mph)", originX + plotW / 2, originY + 30);

            p.push();
            p.translate(originX - 45, originY - plotH / 2);
            p.rotate(-Math.PI / 2);
            p.textAlign(p.CENTER, p.TOP);
            p.text("Average Match Duration (minutes)", 0, 0);
            p.pop();

            // scatter points: each year one dot
            p.textAlign(p.LEFT, p.BOTTOM);
            for (let i = 0; i < this._years.length; i++) {
                const year = this._years[i];
                const mins = this._minutes[i];
                const spd = this._speeds[i];

                const x = p.map(spd, this._minSpeed, this._maxSpeed, originX, originX + plotW);
                const y = p.map(mins, this._minMinutes, this._maxMinutes, originY, originY - plotH);

                // point
                p.noStroke();
                p.fill(40, 100, 180);
                p.circle(x, y, 7);

                // year label next to point
                p.fill(0);
                p.textSize(11);
                p.text(year.toString(), x + 6, y - 4);
            }

            // title
            p.fill(0);
            p.textAlign(p.LEFT, p.BOTTOM);
            p.textSize(16);
            p.text("RQ1 – Match Duration vs Serve Speed (Grand Slams, 2011–2015)",
                marginLeft, marginTop - 15);
        }
    };

    window.VizRQ1_PaceSpeed = Viz;
})();
