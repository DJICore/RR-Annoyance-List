import { rules } from './Data/rules.mjs'
import { players } from './Data/players.mjs'
import { request } from './Modules/API.mjs';

$(function () {

  const _ = {
    data: {
      recnet: {
        proxy: { enabled: true, baseUrl: 'https://corsproxy.io/' },
        endpoints: {
          accountSearch: 'https://apim.rec.net/accounts/account/search?name={{accountName}}',
          accountById: 'https://accounts.rec.net/account/bulk{{queryIds}}' // Example: ?id=1&id=2&id=3
        }
      },
      htmlIcons: {
        check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 0 512 512" width="1em" height="1em" fill="currentColor">
          <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"></path>
        </svg>`,
        sortDefault: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-96 0 512 512" width="1em" height="1em" fill="currentColor">
          <path d="M137.4 41.4c12.5-12.5 32.8-12.5 45.3 0l128 128c9.2 9.2 11.9 22.9 6.9 34.9s-16.6 19.8-29.6 19.8H32c-12.9 0-24.6-7.8-29.6-19.8s-2.2-25.7 6.9-34.9l128-128zm0 429.3l-128-128c-9.2-9.2-11.9-22.9-6.9-34.9s16.6-19.8 29.6-19.8H288c12.9 0 24.6 7.8 29.6 19.8s2.2 25.7-6.9 34.9l-128 128c-12.5 12.5-32.8 12.5-45.3 0z"></path>
        </svg>`,
        sortUp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-96 0 512 512" width="1em" height="1em" fill="currentColor">
          <path d="M182.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8H288c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-128-128z"></path>
        </svg>`,
        sortDown: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-96 0 512 512" width="1em" height="1em" fill="currentColor">
          <path d="M182.6 470.6c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-9.2-9.2-11.9-22.9-6.9-34.9s16.6-19.8 29.6-19.8H288c12.9 0 24.6 7.8 29.6 19.8s2.2 25.7-6.9 34.9l-128 128z"></path>
        </svg>`,
        idBadge: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-64 0 512 512" width="1em" height="1em" fill="currentColor">
          <path d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H64zm96 320h64c44.2 0 80 35.8 80 80c0 8.8-7.2 16-16 16H96c-8.8 0-16-7.2-16-16c0-44.2 35.8-80 80-80zm-32-96a64 64 0 1 1 128 0 64 64 0 1 1 -128 0zM144 64h96c8.8 0 16 7.2 16 16s-7.2 16-16 16H144c-8.8 0-16-7.2-16-16s7.2-16 16-16z"></path>
        </svg>`,
        shield: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor">
          <path d="M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0z"></path>
        </svg>`
      },
      insertPlayers: []
    },
    init: () => {
      console.log('Loaded rules:', Object.keys(rules).length);
      console.log('Loaded players:', players.length);
      console.log('Example - Violations for @BearDaBear:', _.func.getPlayerViolations('@BearDaBear'));
      _.render.table.players();
      _.render.toolbar.buttons();
      _.load.table.toolbar.search();
      _.load.table.toolbar.sortButton();
    },
    func: {
      getViolationDefinition: (violationId) => {
        return rules[violationId] || null;
      },
      getPlayerViolations: (playerName) => {
        let violations = [];
        let violationsDefined = [];
        const player = players.find(p => p.accountName === playerName);
        violations = player ? player.violations : [];
        $.each(violations, (index, violationId) => {
          const definition = _.func.getViolationDefinition(violationId);
          if (definition) {
            violationsDefined.push(definition);
          }
        });
        return violationsDefined;
      },
      selectElementContents: (el) => {
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    },
    load: {
      table: {
        toolbar: {
          search: () => {
            let searchElement = $('#tableSearchBar');
            let tableBody = $('#tableBody');
            searchElement.on('keyup', function () {
              const query = $(this).val().toLowerCase();
              tableBody.find('tr').each(function () {
                const row = $(this);
                const playerName = row.find('.player-account-name').text().toLowerCase();
                if (playerName.includes(query)) {
                  row.show();
                } else {
                  row.hide();
                }
              });
            });
          },
          sortButton: () => {
            let sortButton = $('#tableSortButton');
            let tableBody = $('#tableBody');
            let sortStates = ['default', 'asc', 'desc'];
            let currentStateIndex = 0;
            sortButton.on('click', function () {
              currentStateIndex = (currentStateIndex + 1) % sortStates.length;
              const currentState = sortStates[currentStateIndex];
              sortButton.html(_.data.htmlIcons['sort' + (currentState === 'default' ? 'Default' : currentState === 'asc' ? 'Up' : 'Down')]);
              let rows = tableBody.find('tr').get();
              rows.sort((a, b) => {
                const nameA = $(a).find('.player-account-name').text().toLowerCase();
                const nameB = $(b).find('.player-account-name').text().toLowerCase();
                if (currentState === 'asc') {
                  return nameA.localeCompare(nameB);
                } else if (currentState === 'desc') {
                  return nameB.localeCompare(nameA);
                }
                return 0;
              });
              tableBody.append(rows);
            });
          }
        }
      }
    },
    render: {
      table: {
        players: async () => {
          $('.sample-row').remove(); // Clear existing sample rows
          let rowTemplate = `<tr>
            <td class="player-account-name"><a target="_blank" href="https://rec.net/user/{{accountName}}"><b id="playername-{{accountId}}">{{accountName}}</b></a></td>
            <td class="player-display-name"></td>
            <td>{{accountId}}</td>
            <td class="player-violations">{{violations}}</td>
          </tr>`;
          let violationPillTemplate = `<span class="violation-pill" data-bs-toggle="tooltip" data-bss-tooltip title="{{description}}" value="{{id}}">{{title}}</span>`;
          let tableBody = $('#tableBody');
          $.each(players, (index, player) => {
            let violationsHtml = '';
            $.each(player.violations, (violationIndex, violationId) => {
              const definition = _.func.getViolationDefinition(violationId);
              if (definition) {
                violationsHtml += violationPillTemplate
                  .replace('{{id}}', violationId)
                  .replace('{{title}}', definition.title)
                  .replace('{{description}}', definition.description);
              }
            });
            tableBody.append(rowTemplate
              .replace('{{accountId}}', player.accountId)
              .replace('{{accountName}}', player.accountNameFallback)
              .replace('{{accountName}}', player.accountNameFallback)
              .replace('{{accountId}}', player.accountId)
              .replace('{{violations}}', violationsHtml));
          });
          // Initialize tooltips
          $('[data-bs-toggle="tooltip"]').tooltip();

          const playerIDs = players.map(player => player.accountId);
          const queryIds = playerIDs.map(id => `id=${id}`).join('&');
          const accountsRequest = await request({
            url: _.data.recnet.endpoints.accountById.replace('{{queryIds}}', '?' + queryIds),
            proxy: _.data.recnet.proxy
          });
          const accountsData = accountsRequest.data;
          console.log('Fetched account data for players:', accountsData);
          $.each(accountsData, (index, account) => {
            const playerNameElement = $(`#playername-${account.accountId}`);
            if (playerNameElement.length) {
              playerNameElement.html('@' + account.username);
              const playerHrefElement = playerNameElement.parent();
              playerHrefElement.attr('href', 'https://rec.net/user/' + account.username);
            }
            const playerDisplayNameElement = playerNameElement.parent().parent().parent().find('.player-display-name');
            if (playerDisplayNameElement.length) {
              playerDisplayNameElement.html(account.displayName);
            }
          });
        },
        rules: () => {
          $('.sample-row').remove(); // Clear existing sample rows
          let rowTemplate = `<tr>
            <td><b>{{title}}</b></td>
            <td>{{description}}</td>
          </tr>`;
          let tableBody = $('#tableBodyRules');
          tableBody.empty();
          $.each(rules, (id, rule) => {
            tableBody.append(rowTemplate
              .replace('{{title}}', rule.title)
              .replace('{{description}}', rule.description));
          });
        }
      },
      toolbar: {
        buttons: () => {
          let rulesButtonText = '{{icon}}Rules: {{amount}}'
          rulesButtonText = rulesButtonText.replace('{{icon}}', _.data.htmlIcons.shield);
          rulesButtonText = rulesButtonText.replace('{{amount}}', Object.keys(rules).length);
          $('#rules-button').html(rulesButtonText);
          $('#rules-button').on('click', () => {
            $('#rules-modal').modal('show');
            _.render.table.rules();
          });

          let playersButtonText = '{{icon}}Players: {{amount}}'
          playersButtonText = playersButtonText.replace('{{icon}}', _.data.htmlIcons.idBadge);
          playersButtonText = playersButtonText.replace('{{amount}}', players.length);
          $('#players-button').html(playersButtonText);

          $('#insert-players-button').on('click', () => {
            _.data.insertPlayers = [];
            _.render.modals.insertPlayers.refreshTable();
            _.render.modals.insertPlayers.init.playerSearch();
            _.render.modals.insertPlayers.init.violationDropdown();
            _.render.modals.insertPlayers.init.buttons();
            $('#insert-players-modal').modal('show');
          });
        }
      },
      modals: {
        insertPlayers: {
          init: {
            playerSearch: () => {
              // Initialize player search inputs and dropdowns
              let playerInputs = $('#insert-players-modal .player-input');
              playerInputs.on('focus', function () {
                _.func.selectElementContents(this);
              });
              playerInputs.on('keyup', async function () {
                const playerInput = $(this);
                const query = playerInput.html();
                if (query.length < 2) return;
                const matchedPlayers = await request({
                  url: _.data.recnet.endpoints.accountSearch.replace('{{accountName}}', encodeURIComponent(query)),
                  proxy: _.data.recnet.proxy
                });
                _.render.modals.insertPlayers.showPlayerSearchDropdown(playerInput, matchedPlayers.data);
              });
            },
            violationDropdown: () => {
              // Initialize violation dropdowns
              let violationInputs = $('#insert-players-modal .player-violations');
              violationInputs.on('click', function () {
                const violationInput = $(this);
                _.render.modals.insertPlayers.showViolationDropdown(violationInput);
              });
              const violationDropdown = $('#insert-players-modal #violations-dropdown');
              $(document).on('click', function (e) {
                const hasId = $(e.target).attr('id') === '#violations-dropdown';
                const hasClass = $(e.target).hasClass('player-violations');
                const isDropdownItem = $(e.target).hasClass('dropdown-item');
                if (!hasId && !hasClass && !isDropdownItem) {
                  violationDropdown.empty();
                }
              });
            },
            buttons: () => {
              // Initialize add player button
              let addPlayerButton = $('#insert-players-modal #add-player-button');
              let tableBody = $('#insert-players-modal #tableBodyInsertPlayers');
              let playerRowTemplate = `<tr>
                <td class="player-input" contenteditable="true">Player</td>
                <td class="player-id"></td>
                <td class="player-violations"> </td>
              </tr>`;
              addPlayerButton.on('click', function () {
                _.render.modals.insertPlayers.refreshTable();
                tableBody.append(playerRowTemplate);
                _.render.modals.insertPlayers.init.playerSearch();
                _.render.modals.insertPlayers.init.violationDropdown();
              });

              // Initialize export JSON button
              let exportJSONButton = $('#insert-players-modal #export-json-button');
              let jsonOutput = $('#insert-players-export-json-modal #export-json-output');
              let exportJSONModal = $('#insert-players-export-json-modal');
              let insertPlayersModal = $('#insert-players-modal');
              exportJSONButton.on('click', function () {
                _.render.modals.insertPlayers.updateJSONOutput();
                const jsonString = JSON.stringify(_.data.insertPlayers, null, 2);
                jsonOutput.text(jsonString);
                exportJSONModal.modal('show');
                insertPlayersModal.modal('hide');
                _.func.selectElementContents(jsonOutput[0]);
              });
            }
          },
          showPlayerSearchDropdown: (inputElement, searchResults) => {

            // Set dropdown position variables
            let inputX = inputElement.offset().left;
            let inputY = inputElement.offset().top + inputElement.outerHeight();

            // Get dropdown element
            let playerSearchDropdown = $('#insert-players-modal #player-search-dropdown');

            // Clear previous results
            playerSearchDropdown.empty();

            // Populate dropdown with search results
            $.each(searchResults, (index, player) => {

              // Check if player id is already in the player insertion table
              let exists = false;
              let existingPlayerIDs = [];
              let existingPlayerIDsElements = $('#insert-players-modal #tableBodyInsertPlayers .player-id');
              $.each(existingPlayerIDsElements, (i, elem) => {
                existingPlayerIDs.push($(elem).html().trim());
              });
              // Check if player ID already exists
              if (existingPlayerIDs.includes(player.accountId.toString())) {
                exists = true;
              }

              // Skip if player already exists in the list
              if (exists) return;

              // Create dropdown option
              const option = $(`<div class="dropdown-item" data-account-id="${player.accountId}">AN: ${player.username} - DN: ${player.displayName}</div>`);

              // Handle option click
              option.on('click', function () {

                // Update input element with selected player information
                inputElement.html('@' + player.username);
                inputElement.parent().find('.player-id').html(player.accountId);

                // Clear dropdown and update JSON output
                playerSearchDropdown.empty();
                _.render.modals.insertPlayers.updateJSONOutput();

              });

              // Append option to dropdown
              playerSearchDropdown.append(option);

            });

            // Position dropdown below input element
            playerSearchDropdown.css({ top: inputY, left: inputX });

          },
          showViolationDropdown: (inputElement) => {
            let inputX = inputElement.offset().left;
            let inputY = inputElement.offset().top + inputElement.outerHeight();
            let violationsDropdown = $('#insert-players-modal #violations-dropdown');
            let selectedViolations = [];
            inputElement.find('.violation-pill').each(function () {
              const violationId = parseInt($(this).attr('data-violation-id'));
              selectedViolations.push(violationId);
            });
            violationsDropdown.empty();
            $.each(rules, (violationId, rule) => {
              const iconCheck = selectedViolations.includes(parseInt(violationId)) ? _.data.htmlIcons.check : '';
              const option = $(`<div class="dropdown-item" data-violation-id="${violationId}">${rule.title} ${iconCheck}</div>`);
              option.on('click', function () {
                if (iconCheck) {
                  inputElement.find(`.violation-pill[data-violation-id="${violationId}"]`).remove();
                } else {
                  inputElement.append(`<span class="violation-pill" data-violation-id="${violationId}">${rule.title}</span>`);
                }
                _.render.modals.insertPlayers.showViolationDropdown(inputElement);
                _.render.modals.insertPlayers.updateJSONOutput();
              });
              violationsDropdown.append(option);
            });
            violationsDropdown.css({ top: inputY, left: inputX });
          },
          updateJSONOutput: () => {
            let outputArray = [];
            let tableBody = $('#insert-players-modal #tableBodyInsertPlayers');
            $.each(tableBody.find('tr'), (index, row) => {
              const rowElement = $(row);
              const accountName = rowElement.find('.player-input').html().trim();
              const accountId = rowElement.find('.player-id').html().trim();
              if (!accountName || !accountId) return;
              let violations = [];
              rowElement.find('.violation-pill').each(function () {
                const violationId = parseInt($(this).attr('data-violation-id'));
                violations.push(violationId);
              });
              outputArray.push({
                accountName: accountName,
                accountId: accountId,
                violations: violations
              });
            });
            _.data.insertPlayers = outputArray;
            console.log('JSON Output updated:', _.data.insertPlayers);
          },
          refreshTable: () => {
            let tableBody = $('#insert-players-modal #tableBodyInsertPlayers');
            let violationPillTemplate = `<span class="violation-pill" data-violation-id="{{id}}">{{title}}</span>`;
            let rowTemplate = `<tr>
              <td class="player-input" contenteditable="true">{{accountName}}</td>
              <td class="player-id">{{accountId}}</td>
              <td class="player-violations"> {{violations}}</td>
            </tr>`;
            tableBody.empty();
            $.each(_.data.insertPlayers, (index, player) => {
              let violationsHtml = '';
              $.each(player.violations, (violationIndex, violationId) => {
                const definition = _.func.getViolationDefinition(violationId);
                if (definition) {
                  violationsHtml += violationPillTemplate
                    .replace('{{id}}', violationId)
                    .replace('{{title}}', definition.title);
                }
              });
              const rowHtml = rowTemplate
                .replace('{{accountName}}', player.accountName)
                .replace('{{accountId}}', player.accountId)
                .replace('{{violations}}', violationsHtml);
              tableBody.append(rowHtml);
            });
          }
        }
      }
    }
  }

  _.init();

});