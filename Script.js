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

		class CookieClickerGame {
			constructor(root) {
				this.root = root;
				this.cookie = new Cookie();
				this.upgrades = this.createUpgrades();
				this.displays = this.findDisplays();
				this.audioContext = null;
				this.bindEvents();
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

			bindEvents() {
				this.root.addEventListener('click', (event) => {
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
					const isPepeSprinkles = upgrade.name === 'Extra sprinkles';
					button.type = 'button';
					button.className = 'upgrade';
					button.dataset.action = 'buy-upgrade';
					button.dataset.upgradeIndex = index;
					button.disabled = upgrade.purchased || !this.cookie.canAfford(upgrade.cost);
					button.innerHTML = `
						<span class="upgrade-main">
							<span class="upgrade-icon" aria-hidden="true">
								${isPepeSprinkles ? '<img class="upgrade-image" src="Pepe.webp" alt="Pepe">' : '✨'}
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

		class Application {
			static start() {
				new CookieClickerGame(document.querySelector('main'));
			}
		}

		document.addEventListener('DOMContentLoaded', Application.start);