// ==UserScript==
// @name         Twitch disable Chat on to many chatter
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Adjust chat visibility based on user-defined Twitch viewer thresholds.
// @author       KleinerCodeDrago
// @match        https://www.twitch.tv/*
// @grant        GM_setValue
// @grant        GM_getValue
// @updateURL    https://github.com/KleinerCodeDrago/TwitchDisableChatOnToManyChatter/raw/master/userscript.user.js
// @downloadURL  https://github.com/KleinerCodeDrago/TwitchDisableChatOnToManyChatter/raw/master/userscript.user.js
// ==/UserScript==

(function() {
    'use strict';

    let lastUrl = location.href;
    let intervalId;
    let channelSettings = GM_getValue('channelSettings', {});

    function init() {
        clearInterval(intervalId);
        intervalId = setInterval(logUserCounterAndClickButton, 5000);
        createControlButtons();
    }

    function createControlButtons() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.left = '20px';  
        container.style.zIndex = '10000'; 
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; 
        container.style.padding = '10px';
        container.style.borderRadius = '5px'; 

        const tooManyButton = document.createElement('button');
        tooManyButton.textContent = 'Too Many';
        tooManyButton.onclick = () => setUserThreshold('tooMany');
        styleButton(tooManyButton);
        container.appendChild(tooManyButton);

        const acceptableButton = document.createElement('button');
        acceptableButton.textContent = 'Acceptable';
        acceptableButton.onclick = () => setUserThreshold('acceptable');
        styleButton(acceptableButton);
        container.appendChild(acceptableButton);

        document.body.appendChild(container);
    }

    function styleButton(button) {
        button.style.backgroundColor = '#ff4500';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.padding = '5px 10px';
        button.style.margin = '5px';
        button.style.borderRadius = '3px';
        button.style.cursor = 'pointer';
    }

    function setUserThreshold(type) {
        const userCounterValue = getUserCounterValue();
        if (userCounterValue) {
            const channelName = getChannelName();
            if (!channelSettings[channelName]) {
                channelSettings[channelName] = { tooMany: [], acceptable: [] };
            }
            channelSettings[channelName][type].push(userCounterValue);

            const thresholdValues = channelSettings[channelName][type];
            const average = calculateAverage(thresholdValues);
            const min = Math.min(...thresholdValues);
            const max = Math.max(...thresholdValues);

            channelSettings[channelName][`${type}Average`] = average;
            channelSettings[channelName][`${type}Min`] = min;
            channelSettings[channelName][`${type}Max`] = max;

            GM_setValue('channelSettings', channelSettings);
            console.log(`Updated ${type} thresholds for ${channelName}: Average ${average}, Min ${min}, Max ${max}`);
            if (type === 'tooMany') {
              clickButtonIfExpanded();
            }
        }
    }

    function calculateAverage(values) {
        const sum = values.reduce((a, b) => a + b, 0);
        return sum / values.length;
    }

    function urlChanged() {
        const currentUrl = location.href;
        if (lastUrl !== currentUrl) {
            lastUrl = currentUrl;
            init();
        }
    }

    function getUserCounterValue() {
        const userCounterElement = document.querySelector('.fiDbWi > span:nth-child(1)');
        if (userCounterElement) {
            return parseInt(userCounterElement.textContent.replace(/,/g, ''), 10);
        }
        return null;
    }

    function getChannelName() {
        const urlParts = location.href.split('/');
        return urlParts[urlParts.length - 1];
    }

    function logUserCounterAndClickButton() {
        const userCounterValue = getUserCounterValue();
        if (userCounterValue !== null) {
            clearInterval(intervalId);

            console.log('Twitch User Counter:', userCounterValue);
            const channelName = getChannelName();
            const settings = channelSettings[channelName];

            if (settings && userCounterValue > settings.tooMany) {
                clickButtonIfExpanded();
            } else if (settings && userCounterValue <= settings.acceptable) {
                clickButtonIfCollapsed();
            }
        } else {
            console.log('User counter element not found.');
        }
    }

    function clickButtonIfExpanded() {
        const buttonElement = document.querySelector('button[data-a-target="right-column__toggle-collapse-btn"]');
        const surroundingDivElement = buttonElement && buttonElement.closest('.toggle-visibility__right-column');
        if (buttonElement && surroundingDivElement && surroundingDivElement.classList.contains('toggle-visibility__right-column--expanded')) {
            buttonElement.click();
            console.log('Button clicked (expanded).');
        } else {
            console.log('Button element not found or not in the expanded state.');
        }
    }

    function clickButtonIfCollapsed() {
        const buttonElement = document.querySelector('button[data-a-target="right-column__toggle-collapse-btn"]');
        const surroundingDivElement = buttonElement && buttonElement.closest('.toggle-visibility__right-column');
        if (buttonElement && surroundingDivElement && !surroundingDivElement.classList.contains('toggle-visibility__right-column--expanded')) {
            buttonElement.click();
            console.log('Button clicked (collapsed).');
        } else {
            console.log('Button element not found or not in the collapsed state.');
        }
    }

    init();
    setInterval(urlChanged, 5000);
})();
