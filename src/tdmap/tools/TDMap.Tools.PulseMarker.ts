export const IconPulse = L.DivIcon.extend({

    options: {
        className: '',
        iconSize: [60, 60],
        fillColor: '#ff6d00',
        color: '#ff6d00',
        radius: 4
    },

    createIcon: function(options) {
        let div = document.createElement('div');
        div.classList.add('pulse-container');
        div.style.marginLeft = `-${this.options.iconSize[0]/2}px`;
        div.style.marginTop = `-${this.options.iconSize[1]/2}px`;
        let element = `<svg id='pulse-svg' class='pulse-svg' height='${this.options.iconSize[0]}px' width='${this.options.iconSize[1]}px' version='1.1' viewBox='${this.options.iconSize[0]/2} ${this.options.iconSize[1]/2} ${this.options.iconSize[0]} ${this.options.iconSize[1]}' xmlns='http://www.w3.org/2000/svg'>
                        <circle class='wave first-wave' cx='${this.options.iconSize[0]}' cy='${this.options.iconSize[1]}' opacity='0' r='${this.options.radius}'></circle>
                        <circle class='wave second-wave' cx='${this.options.iconSize[0]}' cy='${this.options.iconSize[1]}' opacity='0' r='${this.options.radius}'></circle>
                        <g>
                            <circle class='circle epicenter' cx='${this.options.iconSize[0]}' cy='${this.options.iconSize[1]}' r='${this.options.radius}'></circle>
                        </g>
                    </svg>`;
        let svgCss = `.pulse-svg {overflow:visible;}`;
        let epicenterCss = `.epicenter{fill:${this.options.fillColor};}`;
        let waveCss = `.wave{fill: white;
            animation: pulse-animation 2.7s linear infinite;
            transform-origin: center center;
            stroke: ${this.options.color};
            stroke-width: 3px}`;
        let firstWaveCss = `.first-wave{animation-delay: 1.5s;}`;
        let secondWaveCss = `.second-wave{animation-delay: 1.1s;}`;
        let keyFrame = `@keyframes pulse-animation {
            0% {
                r: 0;
                opacity: 0;
            }
            50% {
                opacity: 0.4;
            }
            70% {
                opacity: 0.09;
            }
            100% {
                r: ${this.options.iconSize[0]/2};
                opacity: 0;
            }
        }`;

        let animationStyleElement = document.createElement('style');
        animationStyleElement.appendChild(document.createTextNode(`${svgCss} ${keyFrame} ${waveCss} ${firstWaveCss} ${secondWaveCss} ${epicenterCss}`));
        div.appendChild(animationStyleElement);
        let elementFromString = new DOMParser().parseFromString(element, 'image/svg+xml');
        elementFromString.getElementById('pulse-svg')
        div.appendChild(elementFromString.getElementById('pulse-svg'));
        return div;
    }
});

export const PulseMarker = L.Marker.extend({
    initialize: function(latlng, options) {
        options.icon = new IconPulse(options);
        L.Marker.prototype.initialize.call(this, latlng, options);
    },
    onAdd: function(map) {
        L.Marker.prototype.onAdd.call(this, map);
        if (this.options.timeout) {
            setTimeout(() => {
                this.remove();
            }, this.options.timeout);
        }
    }
});