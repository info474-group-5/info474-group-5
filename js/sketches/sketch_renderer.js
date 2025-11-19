// sketch_renderer.js

// Responsible for rendering the main visualization based on the current active index
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

            // Section 2: RQ1A – match duration over time
            if (ai === 2) {
                window.VizRQ1_YearlyPace.draw(p, manager, ai, progress);
                return;
            }

            /// Section 3: RQ1B – serve speed vs match duration
            if (ai === 3) {
                window.VizRQ1_PaceSpeed.draw(p, manager, ai, progress);
                return;
            }

            // Sections 4–5: RQ2 (placeholder for now)
            if (ai === 4 || ai === 5) {
                window.VizScatter.draw(p, manager, ai, progress);
                return;
            }

            // Sections 6–7: RQ3 / conclusion (placeholder for now)
            if (ai === 6 || ai === 7) {
                window.VizBar.draw(p, manager, ai, progress);
                return;
            }


        }
    };
})();
