(function () {
    window.Renderer = {

        setData: function (manager) {
            var self = this;

            manager.offsetX = (manager.margin && manager.margin.left) || 20;
            manager.offsetY = (manager.margin && manager.margin.top) || 0;

            function computeLayout(data) {
                manager.data = data;
            }

            computeLayout([]);
            return Promise.resolve(manager.data);
        },

        draw: function (p, manager, ai, progress) {
            try { console.log('Renderer: delegating draw, ai=', ai); } catch (e) { }

            if (ai === 0 || ai === 1) {
                window.VizTitle.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 2) {
                window.Viz_RQ3_B.toggleFilters(false);
                window.Viz_RQ3_a.draw(p, manager, ai, progress);
                return;
            }

            // Section 3: RQ3B (Heatmap)
            if (ai === 3) {
                // Filters are shown inside Viz_RQ3_B.draw()
                window.Viz_RQ3_B.draw(p, manager, ai, progress);
                return;
            }

            // Section 4: Pace & Serving – show a static image
            if (ai === 4) {
                window.Viz_RQ3_B.toggleFilters(false);
                if (!this.section4Img) {
                    this.section4Img = p.loadImage("photos/pace_serve_photo.jpg");
                }
            
                if (this.section4Img) {
                    let imgW = 520;
                    let imgH = (this.section4Img.height / this.section4Img.width) * imgW;
            
                    // current position:
                    let x = manager.offsetX + 20;  // <-- THIS is what controls how far right it goes
                    let y = manager.offsetY + 20;
            
                    p.image(this.section4Img, x, y, imgW, imgH);
                }
                return;
            }
            


            // Section 5: RQ1_A
            if (ai === 5) {
                window.VizRQ1_AcesTrend.draw(p, manager, ai, progress);
                return;
            }

            // Section 6: RQ1_B
            if (ai === 6) {
                window.VizRQ1_AggScatter.draw(p, manager, ai, progress);
                return;
            }

            // Section 7: RQ2
            if (ai === 7) {
                return;
            }

            // Section 8: RQ2_A Rankings & Slam Trajectories
            if (ai === 8) {
                window.Viz_RQ2_RanksSlams.draw(p, manager, ai, progress);
                return;
            }

            // Section 9: RQ2_B Player Dashboard
            if (ai === 9) {
                window.Viz_RQ2B_Dashboard.draw(p, manager, ai, progress);
                return;
            }

            // Section 10: Conclusion
            if (ai === 10) {
                window.VizBar.draw(p, manager, ai, progress);
                return;
            }
        }
    };
})();
