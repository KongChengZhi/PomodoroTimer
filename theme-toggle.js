class ThemeToggle {
    constructor(svgElement) {
        this.svg = svgElement;
        this.isNight = false;
        this.animationDuration = 500;
        
        // 获取SVG元素
        this.background = this.svg.querySelector('#background');
        this.clouds = this.svg.querySelector('#clouds');
        this.stars = this.svg.querySelector('#stars');
        this.toggleButton = this.svg.querySelector('#toggleButton');
        this.sun = this.svg.querySelector('#sun');
        this.moon = this.svg.querySelector('#moon');
        this.hitArea = this.svg.querySelector('#hitArea');

        // 绑定点击事件
        this.hitArea.addEventListener('click', () => this.toggle());
    }

    toggle() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const timeline = {
            background: this.isNight ? 'url(#dayGradient)' : 'url(#nightGradient)',
            cloudsOpacity: this.isNight ? 0.9 : 0,
            starsOpacity: this.isNight ? 0 : 1,
            translateX: this.isNight ? 40 : 140,
            sunOpacity: this.isNight ? 1 : 0,
            moonOpacity: this.isNight ? 0 : 1
        };

        // 创建动画
        const animation = this.toggleButton.animate([
            { transform: `translate(${this.isNight ? 140 : 40}px, 40px)` },
            { transform: `translate(${timeline.translateX}px, 40px)` }
        ], {
            duration: this.animationDuration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        });

        // 背景渐变动画
        this.background.animate([
            { fill: this.isNight ? 'url(#nightGradient)' : 'url(#dayGradient)' },
            { fill: timeline.background }
        ], {
            duration: this.animationDuration,
            fill: 'forwards'
        });

        // 云朵淡入淡出
        this.clouds.animate([
            { opacity: this.isNight ? 0 : 0.9 },
            { opacity: timeline.cloudsOpacity }
        ], {
            duration: this.animationDuration,
            fill: 'forwards'
        });

        // 星星淡入淡出
        this.stars.animate([
            { opacity: this.isNight ? 1 : 0 },
            { opacity: timeline.starsOpacity }
        ], {
            duration: this.animationDuration,
            fill: 'forwards'
        });

        // 太阳/月亮切换
        this.sun.animate([
            { opacity: this.isNight ? 0 : 1 },
            { opacity: timeline.sunOpacity }
        ], {
            duration: this.animationDuration,
            fill: 'forwards'
        });

        this.moon.animate([
            { opacity: this.isNight ? 1 : 0 },
            { opacity: timeline.moonOpacity }
        ], {
            duration: this.animationDuration,
            fill: 'forwards'
        });

        // 动画结束后更新状态
        animation.onfinish = () => {
            this.isNight = !this.isNight;
            this.isAnimating = false;
            
            // 触发主题改变事件
            const event = new CustomEvent('themeChange', {
                detail: { theme: this.isNight ? 'dark' : 'light' }
            });
            this.svg.dispatchEvent(event);
        };
    }
}

// 使用示例
// const svg = document.querySelector('svg');
// const themeToggle = new ThemeToggle(svg);
// svg.addEventListener('themeChange', (e) => {
//     console.log('Theme changed to:', e.detail.theme);
// });
