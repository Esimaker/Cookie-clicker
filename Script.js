// Cookie model
	class Cookie {
			constructor() {
				this.total = 0;
				this.perClick = 1;
				this.perSecond = 0;
			}

			click() {
				this.total += this.perClick;
			}

			addPassiveIncome() {
				this.total += this.perSecond;
			}

			canAfford(cost) {
				return this.total >= cost;
			}

			spend(amount) {
				if (!this.canAfford(amount)) {
					return false;
				}

				this.total -= amount;
				return true;
			}
		}

		// Upgrades
		class Upgrade {
			constructor({ name, description, cost, effect }) {
				this.name = name;
				this.description = description;
				this.cost = cost;
				this.effect = effect;
				this.purchased = false;
			}

			purchase(cookie) {
				if (this.purchased || !cookie.spend(this.cost)) {
					return false;
				}

				this.purchased = true;
				this.effect(cookie);
				return true;
			}
		}

		// Game controller
		class CookieClickerGame {
			constructor(root) {
				this.root = root;
				this.storageKey = 'kermit-clicker-save';
				this.themeKey = 'kermit-clicker-theme';
				this.cookie = new Cookie();
				this.upgrades = this.createUpgrades();
				this.displays = this.findDisplays();
				this.audioContext = null;
				this.loadGame();
				this.bindEvents();
				this.applyTheme();
				this.render();
				this.startPassiveIncome();
			}

			createUpgrades() {
				return [
					new Upgrade({
						name: 'Extra sprinkles',
						description: '+1 cookie per click',
						cost: 25,
						effect: (cookie) => { cookie.perClick += 1; }
					}),
					new Upgrade({
						name: 'Kermit bakery',
						description: '+1 cookie per second',
						cost: 75,
						effect: (cookie) => { cookie.perSecond += 1; }
					}),
					new Upgrade({
						name: 'Golden oven',
						description: '+5 cookies per click',
						cost: 250,
						effect: (cookie) => { cookie.perClick += 5; }
					})
				];
			}

			findDisplays() {
				return {
					score: this.root.querySelector('[data-display="score"]'),
					perClick: this.root.querySelector('[data-display="per-click"]'),
					perSecond: this.root.querySelector('[data-display="per-second"]'),
					upgradeCount: this.root.querySelector('[data-display="upgrade-count"]'),
					upgrades: this.root.querySelector('[data-display="upgrades"]')
				};
			}

			applyTheme() {
				const isDark = localStorage.getItem(this.themeKey) === 'dark';
				document.body.classList.toggle('dark-mode', isDark);
				const themeButton = this.root.parentElement.querySelector('[data-action="theme"]');
				themeButton.textContent = isDark ? 'Light mode' : 'Dark mode';
				themeButton.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
			}

			toggleTheme() {
				const isDark = !document.body.classList.contains('dark-mode');
				localStorage.setItem(this.themeKey, isDark ? 'dark' : 'light');
				this.applyTheme();
			}

			saveGame() {
				const save = {
					total: this.cookie.total,
					perClick: this.cookie.perClick,
					perSecond: this.cookie.perSecond,
					purchasedUpgrades: this.upgrades.map((upgrade) => upgrade.purchased)
				};
				localStorage.setItem(this.storageKey, JSON.stringify(save));
				const saveButton = this.root.parentElement.querySelector('[data-action="save"]');
				saveButton.textContent = 'Saved!';
				window.setTimeout(() => { saveButton.textContent = 'Save game'; }, 1200);
			}

			loadGame() {
				const savedGame = localStorage.getItem(this.storageKey);
				if (!savedGame) {
					return;
				}

				try {
					const save = JSON.parse(savedGame);
					this.cookie.total = Number(save.total) || 0;
					this.cookie.perClick = Number(save.perClick) || 1;
					this.cookie.perSecond = Number(save.perSecond) || 0;
					(save.purchasedUpgrades || []).forEach((purchased, index) => {
						if (purchased && this.upgrades[index]) {
							this.upgrades[index].purchased = true;
						}
					});
				} catch (error) {
					localStorage.removeItem(this.storageKey);
				}
			}

			bindEvents() {
				this.root.parentElement.addEventListener('click', (event) => {
					const actionTarget = event.target.closest('[data-action]');
					if (!actionTarget) {
						return;
					}

					if (actionTarget.dataset.action === 'click-cookie') {
						this.handleCookieClick(actionTarget, event);
					}

					if (actionTarget.dataset.action === 'buy-upgrade') {
						this.buyUpgrade(Number(actionTarget.dataset.upgradeIndex));
					}

					if (actionTarget.dataset.action === 'reset') {
						this.reset();
					}

					if (actionTarget.dataset.action === 'save') {
						this.saveGame();
					}

					if (actionTarget.dataset.action === 'theme') {
						this.toggleTheme();
					}
				});
			}

			handleCookieClick(button, event) {
				this.cookie.click();
				this.createClickPop(button, event);
				this.animateCookieButton(button);
				this.playCroakSound();
				this.render();
			}

			createClickPop(button, event) {
				const pop = document.createElement('span');
				const position = button.getBoundingClientRect();
				const x = event ? event.clientX : position.left + position.width / 2;
				const y = event ? event.clientY : position.top + position.height / 2;
				pop.className = 'click-pop';
				pop.textContent = `+${this.cookie.perClick}`;
				pop.style.left = `${x}px`;
				pop.style.top = `${y}px`;
				document.body.appendChild(pop);
				window.setTimeout(() => pop.remove(), 700);
			}

			animateCookieButton(button) {
				button.classList.remove('is-clicking');
				void button.offsetWidth;
				button.classList.add('is-clicking');
				window.setTimeout(() => button.classList.remove('is-clicking'), 180);
			}

			playCroakSound() {
				const AudioCtor = window.AudioContext || window.webkitAudioContext;
				if (!AudioCtor) {
					return;
				}

				this.audioContext = this.audioContext || new AudioCtor();
				const context = this.audioContext;
				const now = context.currentTime;
				const oscillator = context.createOscillator();
				const gain = context.createGain();

				oscillator.type = 'triangle';
				oscillator.frequency.setValueAtTime(240, now);
				oscillator.frequency.exponentialRampToValueAtTime(110, now + 0.18);

				gain.gain.setValueAtTime(0.0001, now);
				gain.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
				gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

				oscillator.connect(gain);
				gain.connect(context.destination);
				oscillator.start(now);
				oscillator.stop(now + 0.23);
			}

			buyUpgrade(index) {
				if (this.upgrades[index].purchase(this.cookie)) {
					this.render();
				}
			}

			startPassiveIncome() {
				window.setInterval(() => {
					if (this.cookie.perSecond > 0) {
						this.cookie.addPassiveIncome();
						this.render();
					}
				}, 1000);
			}

			reset() {
				localStorage.removeItem(this.storageKey);
				this.cookie = new Cookie();
				this.upgrades = this.createUpgrades();
				this.render();
			}

			render() {
				this.displays.score.textContent = Math.floor(this.cookie.total).toLocaleString();
				this.displays.perClick.textContent = this.cookie.perClick;
				this.displays.perSecond.textContent = this.cookie.perSecond;
				this.displays.upgradeCount.textContent = `${this.upgrades.filter((upgrade) => upgrade.purchased).length}/${this.upgrades.length}`;
				this.renderUpgrades();
			}

			renderUpgrades() {
				this.displays.upgrades.replaceChildren();

				this.upgrades.forEach((upgrade, index) => {
					const button = document.createElement('button');
					const upgradeImages = ['Pepe.webp', 'Parinaz.webp', 'mister.webp'];
					const upgradeColors = ['blue', 'red', 'green'];
					button.type = 'button';
					button.className = 'upgrade';
					button.dataset.upgradeColor = upgradeColors[index];
					button.dataset.action = 'buy-upgrade';
					button.dataset.upgradeIndex = index;
					button.disabled = upgrade.purchased || !this.cookie.canAfford(upgrade.cost);
					button.innerHTML = `
						<span class="upgrade-main">
							<span class="upgrade-icon" aria-hidden="true">
								<img class="upgrade-image" src="${upgradeImages[index]}" alt="">
							</span>
							<span class="upgrade-text">
								<span class="upgrade-name">${upgrade.name}</span>
								<span class="upgrade-description">${upgrade.purchased ? 'Purchased' : upgrade.description}</span>
							</span>
						</span>
						<span class="upgrade-cost">${upgrade.purchased ? '✓' : upgrade.cost}</span>
					`;
					this.displays.upgrades.appendChild(button);
				});
			}
		}

		// Application entry point
		class Application {
			static start() {
				new CookieClickerGame(document.querySelector('main'));
			}
		}

		document.addEventListener('DOMContentLoaded', Application.start);