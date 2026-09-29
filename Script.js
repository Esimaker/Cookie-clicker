// Cookie model
	class Cookie {
			#total = 0;
			#perClick = 1;
			#perSecond = 0;
			#cpsMultiplier = 1;

			get total() { return this.#total; }
			get perClick() { return this.#perClick; }
			get perSecond() { return (this.#perSecond * this.#cpsMultiplier); }
			get rawPerSecond() { return this.#perSecond; }
			get cpsMultiplier() { return this.#cpsMultiplier; }

			set total(val) { this.#total = val; }
			set perClick(val) { this.#perClick = val; }
			set perSecond(val) { this.#perSecond = val; }
			set cpsMultiplier(val) { this.#cpsMultiplier = val; }

			click() {
				this.#total += this.#perClick;
			}

			addPassiveIncome() {
				this.#total += this.perSecond;
			}

			canAfford(cost) {
				return this.#total >= cost;
			}

			spend(amount) {
				if (!this.canAfford(amount)) {
					return false;
				}

				this.#total -= amount;
				return true;
			}
		}

		// Upgrades - Base Class (Abstraction)
		class Upgrade {
			constructor({ name, description, cost }) {
				this.name = name;
				this.description = description;
				this.cost = cost;
			}

			// Polymorphic method
			applyEffect(cookie) {
				throw new Error("applyEffect() must be implemented by subclass");
			}
		}

		// Inheritance: Production Units (Repeatable)
		class ProductionUnit extends Upgrade {
			constructor({ name, description, baseCost, bonus }) {
				super({ name, description, cost: baseCost });
				this.baseCost = baseCost;
				this.bonus = bonus;
				this.count = 0;
				this.maxCount = 100;
			}

			getCurrentCost() {
				return Math.floor(this.baseCost * Math.pow(1.15, this.count));
			}

			purchase(cookie) {
				const cost = this.getCurrentCost();
				if (this.count >= this.maxCount || !cookie.spend(cost)) {
					return false;
				}

				this.count++;
				this.applyEffect(cookie);
				return true;
			}

			applyEffect(cookie) {
				cookie.perSecond = cookie.rawPerSecond + this.bonus;
			}
		}

		// Inheritance: Special Upgrades (One-time)
		class SpecialUpgrade extends Upgrade {
			constructor({ name, description, cost, effectType, effectValue }) {
				super({ name, description, cost });
				this.effectType = effectType; // 'click' or 'multiplier'
				this.effectValue = effectValue;
				this.purchased = false;
			}

			purchase(cookie) {
				if (this.purchased || !cookie.spend(this.cost)) {
					return false;
				}

				this.purchased = true;
				this.applyEffect(cookie);
				return true;
			}

			applyEffect(cookie) {
				if (this.effectType === 'click') {
					cookie.perClick += this.effectValue;
				} else if (this.effectType === 'multiplier') {
					cookie.cpsMultiplier += this.effectValue;
				}
			}
		}

		// Game controller
		class PepeClickerGame {
			constructor(root) {
				this.root = root;
				this.storageKey = 'pepe-clicker-save';
				this.themeKey = 'pepe-clicker-theme';
				this.cookie = new Cookie();
				this.cookieRotation = 0;
				this.renderedPebbleCount = -1;
				
				this.productionUnits = this.createProductionUnits();
				this.upgrades = this.createSpecialUpgrades();
				
				this.displays = this.findDisplays();
				this.magneticUpgrade = null;
				this.audioContext = null;
				this.loadGame();
				this.bindEvents();
				this.applyTheme();
				this.render();
				this.startPassiveIncome();
			}

			createProductionUnits() {
				return [
					new ProductionUnit({ name: 'Pepe Pebble', description: '+0.1 CPS', baseCost: 15, bonus: 0.1 }),
					new ProductionUnit({ name: 'Pepe Bakery', description: '+1 CPS', baseCost: 100, bonus: 1 }),
					new ProductionUnit({ name: 'Frog Farm', description: '+8 CPS', baseCost: 1100, bonus: 8 }),
					new ProductionUnit({ name: 'Lilypad Lab', description: '+47 CPS', baseCost: 12000, bonus: 47 }),
					new ProductionUnit({ name: 'Swamp Syndicate', description: '+260 CPS', baseCost: 130000, bonus: 260 }),
					new ProductionUnit({ name: 'Meme Factory', description: '+1400 CPS', baseCost: 1400000, bonus: 1400 }),
					new ProductionUnit({ name: 'Green Empire', description: '+7800 CPS', baseCost: 20000000, bonus: 7800 }),
					new ProductionUnit({ name: 'Galactic Gulp', description: '+44000 CPS', baseCost: 330000000, bonus: 44000 }),
				];
			}

			createSpecialUpgrades() {
				return [
					new SpecialUpgrade({ name: 'Meme-Powered Clicks', description: '+10 per click', cost: 500, effectType: 'click', effectValue: 10 }),
					new SpecialUpgrade({ name: 'Pepe\'s Auto-Baker', description: '+5% Total CPS', cost: 5000, effectType: 'multiplier', effectValue: 0.05 }),
					new SpecialUpgrade({ name: 'Rare Pepe Vat', description: '+50 per click', cost: 25000, effectType: 'click', effectValue: 50 }),
					new SpecialUpgrade({ name: 'The Great Frog-mony', description: '+20% Total CPS', cost: 100000, effectType: 'multiplier', effectValue: 0.20 }),
					new SpecialUpgrade({ name: 'Intergalactic Pepe-Sliver', description: '+1000 per click', cost: 1000000, effectType: 'click', effectValue: 1000 }),
				];
			}

			findDisplays() {
				return {
					score: this.root.querySelector('[data-display="score"]'),
					perClick: this.root.querySelector('[data-display="per-click"]'),
					perSecond: this.root.querySelector('[data-display="per-second"]'),
					upgradeCount: this.root.querySelector('[data-display="upgrade-count"]'),
					productionCount: this.root.querySelector('[data-display="production-count"]'),
					upgrades: this.root.querySelector('[data-display="upgrades"]'),
					production: this.root.querySelector('[data-display="production"]'),
					pebbleOrbit: this.root.querySelector('[data-display="pebble-orbit"]')
				};
			}

			applyTheme() {
				const isDark = localStorage.getItem(this.themeKey) === 'dark';
				document.body.classList.toggle('dark-mode', isDark);
				const themeButton = this.root.parentElement.querySelector('[data-action="theme"]');
				if (themeButton) {
					themeButton.textContent = isDark ? 'Light mode' : 'Dark mode';
					themeButton.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
				}
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
					perSecond: this.cookie.rawPerSecond,
					cpsMultiplier: this.cookie.cpsMultiplier,
					purchasedUpgrades: this.upgrades.map((u) => u.purchased),
					productionCounts: this.productionUnits.map((u) => u.count)
				};
				localStorage.setItem(this.storageKey, JSON.stringify(save));
				const saveButton = this.root.parentElement.querySelector('[data-action="save"]');
				if (saveButton) {
					saveButton.textContent = 'Saved!';
					window.setTimeout(() => { saveButton.textContent = 'Save game'; }, 1200);
				}
			}

			loadGame() {
				const savedGame = localStorage.getItem(this.storageKey);
				if (!savedGame) return;

				try {
					const save = JSON.parse(savedGame);
					this.cookie.total = Number(save.total) || 0;
					this.cookie.perClick = Number(save.perClick) || 1;
					this.cookie.perSecond = Number(save.perSecond) || 0;
					this.cookie.cpsMultiplier = Number(save.cpsMultiplier) || 1;
					
					(save.purchasedUpgrades || []).forEach((purchased, index) => {
						if (purchased && this.upgrades[index]) {
							this.upgrades[index].purchased = true;
						}
					});

					(save.productionCounts || []).forEach((count, index) => {
						if (this.productionUnits[index]) {
							this.productionUnits[index].count = count;
						}
					});
				} catch (error) {
					localStorage.removeItem(this.storageKey);
				}
			}

			bindEvents() {
				const clickPrompt = this.root.querySelector('.click-prompt');
				const cookieButton = this.root.querySelector('.cookie-button');
				const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
				const resetClickPrompt = () => {
					clickPrompt.style.removeProperty('--magnetic-x');
					clickPrompt.style.removeProperty('--magnetic-y');
				};

				document.addEventListener('pointermove', (event) => {
					if (event.pointerType !== 'mouse' || reduceMotion.matches) {
						resetClickPrompt();
						return;
					}

					const buttonBounds = cookieButton.getBoundingClientRect();
					const buttonCenterX = buttonBounds.left + buttonBounds.width / 2;
					const buttonCenterY = buttonBounds.top + buttonBounds.height / 2;
					const distance = Math.hypot(event.clientX - buttonCenterX, event.clientY - buttonCenterY);
					const radius = 260;

					if (distance >= radius) {
						resetClickPrompt();
						return;
					}

					const promptBounds = clickPrompt.getBoundingClientRect();
					const strength = 1 - distance / radius;
					const offsetX = (event.clientX - (promptBounds.left + promptBounds.width / 2)) * strength * 0.12;
					const offsetY = (event.clientY - (promptBounds.top + promptBounds.height / 2)) * strength * 0.12;
					clickPrompt.style.setProperty('--magnetic-x', `${Math.max(-16, Math.min(16, offsetX))}px`);
					clickPrompt.style.setProperty('--magnetic-y', `${Math.max(-12, Math.min(12, offsetY))}px`);
				});
				document.addEventListener('pointerleave', resetClickPrompt);

				this.displays.upgrades.addEventListener('pointermove', (event) => {
					const button = event.target.closest('.upgrade');
					if (this.magneticUpgrade && this.magneticUpgrade !== button) {
						this.resetMagneticUpgrade();
					}

					if (!button || button.disabled || event.pointerType !== 'mouse') {
						return;
					}

					const bounds = button.getBoundingClientRect();
					const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
					const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;
					button.style.setProperty('--magnetic-x', `${offsetX * 12}px`);
					button.style.setProperty('--magnetic-y', `${offsetY * 10}px`);
					button.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
					button.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
					this.magneticUpgrade = button;
				});
				this.displays.upgrades.addEventListener('pointerleave', () => this.resetMagneticUpgrade());

				this.root.parentElement.addEventListener('click', (event) => {
					const actionTarget = event.target.closest('[data-action]');
					if (!actionTarget) return;

					const action = actionTarget.dataset.action;
					if (action === 'click-cookie') this.handleCookieClick(actionTarget, event);
					if (action === 'brand-sound') this.playBrandSound();
					if (action === 'buy-upgrade') this.buyUpgrade(Number(actionTarget.dataset.upgradeIndex));
					if (action === 'buy-production') this.buyProduction(Number(actionTarget.dataset.upgradeIndex), actionTarget);
					if (action === 'reset') this.reset();
					if (action === 'save') this.saveGame();
					if (action === 'theme') this.toggleTheme();
				});
			}

			resetMagneticUpgrade() {
				if (!this.magneticUpgrade) {
					return;
				}

				this.magneticUpgrade.style.removeProperty('--magnetic-x');
				this.magneticUpgrade.style.removeProperty('--magnetic-y');
				this.magneticUpgrade = null;
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
				this.cookieRotation = (this.cookieRotation + 5) % 360;
				button.querySelector('.cookie-image').style.setProperty('--cookie-rotation', `${this.cookieRotation}deg`);
			}

			playCroakSound() {
				const AudioCtor = window.AudioContext || window.webkitAudioContext;
				if (!AudioCtor) return;

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

			playBrandSound() {
				if (!this.brandSound) {
					this.brandSound = new Audio('freesound_community-yay-6120.mp3');
					this.brandSound.preload = 'auto';
				}
				this.brandSound.currentTime = 0;
				this.brandSound.play().catch(() => {});
			}

			playUpgradeSound() {
				const AudioCtor = window.AudioContext || window.webkitAudioContext;
				if (!AudioCtor) return;

				this.audioContext = this.audioContext || new AudioCtor();
				const context = this.audioContext;
				const notes = [660, 880, 1320];

				notes.forEach((frequency, index) => {
					const oscillator = context.createOscillator();
					const gain = context.createGain();
					const startAt = context.currentTime + index * 0.07;

					oscillator.type = index === 0 ? 'square' : 'triangle';
					oscillator.frequency.setValueAtTime(frequency, startAt);

					gain.gain.setValueAtTime(0.0001, startAt);
					gain.gain.exponentialRampToValueAtTime(0.08, startAt + 0.01);
					gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.16);

					oscillator.connect(gain);
					gain.connect(context.destination);
					oscillator.start(startAt);
					oscillator.stop(startAt + 0.18);
				});
			}

			buyUpgrade(index) {
				if (this.upgrades[index].purchase(this.cookie)) {
					this.playUpgradeSound();
					this.render();
					const purchasedButton = this.displays.upgrades.querySelector(`[data-upgrade-index="${index}"]`);
					purchasedButton.classList.add('is-purchased');
				}
			}

			buyProduction(index, button) {
				if (this.productionUnits[index].purchase(this.cookie)) {
					this.playUpgradeSound();
					this.playProductionFlyout(button);
					this.render();
				}
			}

			playProductionFlyout(button) {
				if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

				const bounds = button.getBoundingClientRect();
				const flyout = button.cloneNode(true);
				flyout.classList.remove('is-available');
				flyout.classList.add('production-flyout');
				flyout.disabled = true;
				flyout.setAttribute('aria-hidden', 'true');
				flyout.removeAttribute('data-action');
				flyout.style.position = 'fixed';
				flyout.style.left = `${bounds.left}px`;
				flyout.style.top = `${bounds.top}px`;
				flyout.style.width = `${bounds.width}px`;
				flyout.style.height = `${bounds.height}px`;
				flyout.style.margin = '0';
				flyout.addEventListener('animationend', () => flyout.remove(), { once: true });
				document.body.appendChild(flyout);
				window.setTimeout(() => flyout.remove(), 900);
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
				this.cookieRotation = 0;
				this.productionUnits = this.createProductionUnits();
				this.upgrades = this.createSpecialUpgrades();
				this.root.querySelector('.cookie-image').style.setProperty('--cookie-rotation', '0deg');
				this.render();
			}

			render() {
				this.displays.score.textContent = Math.floor(this.cookie.total).toLocaleString();
				this.displays.perClick.textContent = this.cookie.perClick;
				this.displays.perSecond.textContent = this.cookie.perSecond.toFixed(1);
				
				const totalUpgrades = this.upgrades.filter(u => u.purchased).length;
				this.displays.upgradeCount.textContent = `${totalUpgrades}/${this.upgrades.length}`;
				
				const totalProduction = this.productionUnits.reduce((sum, u) => sum + u.count, 0);
				this.displays.productionCount.textContent = `${totalProduction}/800`; // 8 units * 100
				
				this.renderUpgrades();
				this.renderProduction();
				this.renderPebbleOrbit();
			}

			renderPebbleOrbit() {
				const count = this.productionUnits[0].count;
				if (count === this.renderedPebbleCount) return;

				this.renderedPebbleCount = count;
				const stage = this.displays.pebbleOrbit.parentElement;
				const button = stage.querySelector('.cookie-button');
				const stageBounds = stage.getBoundingClientRect();
				const buttonBounds = button.getBoundingClientRect();
				const radius = Math.min(buttonBounds.width / 2 + 26, stageBounds.width / 2 - 22);
				const visibleCount = Math.min(count, 24);
				const pebbles = Array.from({ length: visibleCount }, (_, index) => {
					const angle = (index / visibleCount) * Math.PI * 2 - Math.PI / 2;
					const image = document.createElement('img');
					image.className = 'pebble-orbit-image';
					image.src = 'Pepe.webp';
					image.alt = '';
					image.style.left = `${(stageBounds.width / 2 + Math.cos(angle) * radius) / stageBounds.width * 100}%`;
					image.style.top = `${(stageBounds.height / 2 + Math.sin(angle) * radius) / stageBounds.height * 100}%`;
					image.style.setProperty('--pebble-delay', `${index * -0.12}s`);
					return image;
				});
				this.displays.pebbleOrbit.replaceChildren(...pebbles);
			}

			renderUpgrades() {
				this.displays.upgrades.replaceChildren();
				this.upgrades.forEach((upgrade, index) => {
					const button = this.createUpgradeButton(upgrade, index, 'buy-upgrade');
					this.displays.upgrades.appendChild(button);
				});
			}

			renderProduction() {
				this.displays.production.replaceChildren();
				this.productionUnits.forEach((unit, index) => {
					const button = this.createUpgradeButton(unit, index, 'buy-production');
					this.displays.production.appendChild(button);
				});
			}

			createUpgradeButton(item, index, action) {
				const upgradeImages = [
					'Pepe.webp', 
					'Parinaz.webp', 
					'Pepe Wink Pepe GIF - Pepe Wink Pepe Wink - Discover & Share GIFs.gif', 
					'mister.webp',
					'Pepe.png',
					'Pepe (1).png',
					'351912467071492-3.webp',
					'18366310974687406.png'
				];
				const upgradeColors = ['blue', 'red', 'green', 'yellow', 'purple', 'orange'];
				
				const cost = item instanceof ProductionUnit ? item.getCurrentCost() : item.cost;
				const isAvailable = (item instanceof ProductionUnit ? item.count < 100 : !item.purchased) && this.cookie.canAfford(cost);
				
				const button = document.createElement('button');
				button.type = 'button';
				
				// Apply different classes based on type for styling
				const typeClass = item instanceof ProductionUnit ? 'unit-button' : 'special-button';
				button.className = `upgrade ${typeClass}${isAvailable ? ' is-available' : ''}`;
				
				button.dataset.upgradeColor = upgradeColors[index % upgradeColors.length];
				button.dataset.action = action;
				button.dataset.upgradeIndex = index;
				
				const disabled = (item instanceof ProductionUnit ? item.count >= 100 : item.purchased) || !this.cookie.canAfford(cost);
				button.disabled = disabled;
				
				// New logic for labels and descriptions to show costs clearly
				let label, desc;
				if (item instanceof ProductionUnit) {
					label = item.count >= 100 ? 'MAX' : cost.toLocaleString();
					desc = `${item.description} (x${item.count})`;
				} else {
					label = item.purchased ? '✓' : cost.toLocaleString();
					desc = item.purchased ? 'Purchased' : item.description;
				}

				button.innerHTML = `
					<span class="upgrade-main">
						<span class="upgrade-icon" aria-hidden="true">
							<img class="upgrade-image" src="${upgradeImages[index % upgradeImages.length]}" alt="">
						</span>
						<span class="upgrade-text">
							<span class="upgrade-name">${item.name}</span>
							<span class="upgrade-description">${desc}</span>
						</span>
					</span>
					<span class="upgrade-cost">${label}</span>
				`;
				return button;
			}
		}

		// Application entry point
		class Application {
			static start() {
				new PepeClickerGame(document.querySelector('main'));
			}
		}

		document.addEventListener('DOMContentLoaded', Application.start);