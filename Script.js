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
						this.handleCookieClick(actionTarget);
					}

					if (actionTarget.dataset.action === 'buy-upgrade') {
						this.buyUpgrade(Number(actionTarget.dataset.upgradeIndex));
					}

					if (actionTarget.dataset.action === 'reset') {
						this.reset();
					}
				});
			}

			handleCookieClick(button) {
				this.cookie.click();
				this.createClickPop(button);
				this.render();
			}

			createClickPop(button) {
				const pop = document.createElement('span');
				const position = button.getBoundingClientRect();
				pop.className = 'click-pop';
				pop.textContent = `+${this.cookie.perClick}`;
				pop.style.left = `${position.left + position.width / 2}px`;
				pop.style.top = `${position.top + position.height / 2}px`;
				document.body.appendChild(pop);
				window.setTimeout(() => pop.remove(), 700);
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
					button.type = 'button';
					button.className = 'upgrade';
					button.dataset.action = 'buy-upgrade';
					button.dataset.upgradeIndex = index;
					button.disabled = upgrade.purchased || !this.cookie.canAfford(upgrade.cost);
					button.innerHTML = `<span><span class="upgrade-name">${upgrade.name}</span><span class="upgrade-description">${upgrade.purchased ? 'Purchased' : upgrade.description}</span></span><span class="upgrade-cost">${upgrade.purchased ? '✓' : upgrade.cost}</span>`;
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