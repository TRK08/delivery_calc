document.addEventListener('DOMContentLoaded', () => {
	// Поиск селектов на странице
	const fromStateBox = document.querySelector('.from-state'),
		exportPortBox = document.querySelector('.export-port'),
		importPortBox = document.querySelector('.import-port'),
		importPortContainerBox = document.querySelector('.import-port-container'),
		toCityBox = document.querySelector('.to-city'),
		form = document.querySelector('.form'),
		totalPriceBox = document.querySelector('.total-price'),
		convertPriceBox = document.querySelector('.convert-price')

	// курс валют
	let RUB = 0,
		EUR = 0,
		KZT = 0,
		BYN = 0,
		KGS = 0,
		UZS = 0,
		USD = 1,
		totalPrice = [] // общая цена

	async function convertPrice() {
		let response = await fetch('http://www.floatrates.com/daily/usd.json')
		let data = await response.json()
		return data
	}

	convertPrice()
		.then(function (res) {
			RUB = res.rub.rate
			EUR = res.eur.rate
			KZT = res.kzt.rate
			BYN = res.byn.rate
			KGS = res.kgs.rate
			UZS = res.uzs.rate
		})
		.catch((err) => {
			console.log(err)
		})

	async function getRes() {
		let response = await fetch(
			// 'https://raw.githubusercontent.com/TRK08/Calculator-DB/main/DataBase.json'
			'./DataBase.json'
		)
		let data = await response.json()
		return data
	}

	getRes()
		.then(function (response) {
			let states = response.states,
				stateNames = Object.keys(states) // список названий штатов

			let exportPorts = response.sendToPort,
				exporPortsNames = Object.keys(exportPorts)

			let importPorts = response.truckDelivery,
				importPortsNames = Object.keys(importPorts)

			let europeCities = response.europeCities

			// console.log(importPorts)

			// функция заполнения списков
			function generateList(list, box) {
				for (item of list) {
					let option = document.createElement('option')
					option.innerText = item
					box.appendChild(option)
				}
			}

			generateList(stateNames, fromStateBox)
			generateList(exporPortsNames, exportPortBox)
			generateList(importPortsNames, importPortBox)
			generateList(europeCities, toCityBox)

			let nameOfValute = ['USD', 'RUB', 'EUR', 'KZT', 'BYN', 'KGS', 'UZS']
			generateList(nameOfValute, convertPriceBox)

			function calculatePriceExport(distance) {
				if (distance >= 0 && distance <= 150) {
					return distance * 2.4
				} else if (distance > 150 && distance <= 500) {
					return distance * 1.1
				} else if (distance > 500 && distance <= 1000) {
					return distance * 0.9
				} else if (distance > 1000 && distance <= 1500) {
					return distance * 0.7
				} else if (distance > 1500 && distance <= 2000) {
					return distance * 0.6
				} else if (distance > 2000 && distance <= 5000) {
					return distance * 0.5
				}
			}

			function calculateCorrectionPrice(distance) {
				if (distance >= 0 && distance < 1000) {
					return distance * 0.5
				} else if (distance >= 1000) {
					return distance * 0.4
				}
			}

			function calculateTruckDeliveryPrice(distance) {
				if (distance >= 0 && distance <= 500) {
					return distance
				} else if (distance > 500 && distance <= 1000) {
					return distance * 0.8
				} else if (distance > 1000 && distance <= 1500) {
					return distance * 0.6
				} else if (distance > 1500 && distance <= 2000) {
					return distance * 0.5
				} else if (distance > 2000 && distance <= 10000) {
					return distance * 0.4
				}
			}

			let currentFromState = null, // выбранный штат отправки
				currentExportPort = null, // выбранный порт отправки
				currentImportPort = null, // выбранный порт прибытия
				currentCity = null // выбранный город доставки

			form.addEventListener('change', (e) => {
				if (e.target.classList.contains('from-state')) {
					let statesNames = e.target.childNodes

					// Выбор нужного объекта по названию штата
					statesNames.forEach((state) => {
						if (state.selected) {
							currentFromState = states[state.textContent]
						}
					})

					let deliveryDistance = Object.values(
							currentFromState.sendFromDistance
						),
						deliveryPortName = Object.keys(currentFromState.sendFromDistance),
						deliveryPrice = 0,
						minDistance = Math.min(...deliveryDistance)

					// выбор штата отправки с минимальной ценой
					for (let i = 0; i < deliveryDistance.length; i++) {
						if (deliveryDistance[i] === minDistance) {
							exportPortBox.childNodes.forEach((port) => {
								if (port.textContent === deliveryPortName[i]) {
									port.selected = true
								}
							})
						}
					}

					importPortBox.childNodes.forEach((item) => {
						if (item.textContent === 'Klaipeda') {
							item.selected = true
						}
					})

					deliveryPrice = Math.round(calculatePriceExport(minDistance))
					totalPrice[0] = deliveryPrice

					exportPortBox.disabled = false
					importPortBox.disabled = false
					importPortContainerBox.disabled = false
					toCityBox.disabled = false
					convertPriceBox.disabled = false
				}

				// Запись цены в массив при выборе другого города отправки
				exportPortBox.childNodes.forEach((item) => {
					if (item.selected) {
						currentExportPort = exportPorts[item.textContent]
						let distance = currentFromState.sendFromDistance[item.textContent]
						deliveryPrice = Math.round(calculatePriceExport(distance))
						totalPrice[0] = deliveryPrice
					}
				})

				importPortBox.childNodes.forEach((item) => {
					if (item.selected) {
						currentImportPort = importPorts[item.textContent]
						let distance = currentExportPort[item.textContent].distance,
							price = 0
						correctionPrice = Math.round(calculateCorrectionPrice(distance))

						importPortContainerBox.childNodes.forEach((option) => {
							if (option.selected) {
								price =
									currentExportPort[item.textContent].options[option.value]
										.price
								price = price.reduce((a, b) => a + b) / price.length
								price = Math.round(price)
							}
						})
						totalPrice[1] = correctionPrice + price
					}
				})

				toCityBox.childNodes.forEach((item) => {
					if (item.selected) {
						let distance = currentImportPort[item.textContent].distance
						distance = calculateTruckDeliveryPrice(distance)
						totalPrice[2] = distance
					}
				})

				let additionalExpenses = [200, 150, 125, 150],
					currentCourse = ''

				// totalPriceBox.innerText = `${Math.round(totalPriceNum)} $`

				convertPriceBox.childNodes.forEach((item) => {
					if (item.selected) {
						switch (item.textContent) {
							case 'USD':
								totalPrice = totalPrice.map((item) => Math.round(item * USD))
								additionalExpenses = additionalExpenses.map((item) =>
									Math.round(item * USD)
								)
								currentCourse = '$'
								break
							case 'RUB':
								totalPrice = totalPrice.map((item) => Math.round(item * RUB))
								additionalExpenses = additionalExpenses.map((item) =>
									Math.round(item * RUB)
								)
								currentCourse = '₽'
								break
							case 'EUR':
								totalPrice = totalPrice.map((item) => Math.round(item * EUR))
								additionalExpenses = additionalExpenses.map((item) =>
									Math.round(item * EUR)
								)
								currentCourse = '€'
								break
							case 'KZT':
								totalPrice = totalPrice.map((item) => Math.round(item * KZT))
								additionalExpenses = additionalExpenses.map((item) =>
									Math.round(item * KZT)
								)
								currentCourse = '₸'
								break
							case 'BYN':
								totalPrice = totalPrice.map((item) => Math.round(item * BYN))
								additionalExpenses = additionalExpenses.map((item) =>
									Math.round(item * BYN)
								)
								currentCourse = 'BYN'
								break
							case 'KGS':
								totalPrice = totalPrice.map((item) => Math.round(item * KGS))
								additionalExpenses = additionalExpenses.map((item) =>
									Math.round(item * KGS)
								)
								currentCourse = 'KGS'
								break
							case 'UZS':
								totalPrice = totalPrice.map((item) => Math.round(item * UZS))
								additionalExpenses = additionalExpenses.map((item) =>
									Math.round(item * UZS)
								)
								currentCourse = 'UZS'
								break
						}
					}
				})

				let totalPriceNum = 0

				additionalExpenses.forEach((item) => {
					totalPriceNum = totalPriceNum + item
				})

				totalPrice.forEach((item) => {
					totalPriceNum = totalPriceNum + item
				})

				document.querySelector(
					'.send-usa'
				).innerHTML = `<span>Доставка по США: ${totalPrice[0]} ${currentCourse}</span>`

				document.querySelector(
					'.export-port-consumption'
				).innerHTML = `<span>Расходы порт экспорта: ${additionalExpenses[0]} ${currentCourse}</span>`
				document.querySelector(
					'.export-consumption'
				).innerHTML = `<span>Экспортные расходы: ${additionalExpenses[1]} ${currentCourse}</span>`
				document.querySelector(
					'.sea-fracht'
				).innerHTML = `<span>Морской фрахт: ${totalPrice[1]} ${currentCourse}</span>`
				document.querySelector(
					'.import-port-consumption'
				).innerHTML = `<span>Расходы порт импорта:  ${additionalExpenses[2]} ${currentCourse}</span>`
				document.querySelector(
					'.transit-clearence'
				).innerHTML = `<span>Транзитное оформление: ${additionalExpenses[3]} ${currentCourse}</span>`
				document.querySelector(
					'.send-to-svh'
				).innerHTML = `<span>Доставка до СВХ: ${totalPrice[2]} ${currentCourse}</span>`

				totalPriceBox.innerHTML = `Итого: ${totalPriceNum} ${currentCourse}`
			})
		})
		.catch((error) => {
			console.log(error)
		})
})
