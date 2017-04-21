angular
  .module('walletApp')
  .controller('ExportHistoryController', ExportHistoryController);

function ExportHistoryController ($scope, $sce, $timeout, $translate, $filter, format, Wallet, Alerts, ExportHistory, activeIndex) {
  $scope.limit = 50;
  $scope.incLimit = () => $scope.limit += 50;

  $scope.ableBrowsers = ['chrome', 'firefox'];
  $scope.canTriggerDownload = $scope.ableBrowsers.indexOf(browserDetection().browser) > -1;

  let accounts = Wallet.accounts().filter(a => !a.archived && a.index != null);
  let addresses = Wallet.legacyAddresses().filter(a => !a.archived).map(a => a.address);

  let all = {
    index: '',
    label: $translate.instant('ALL_ACCOUNTS'),
    address: accounts.map(a => a.extendedPublicKey).concat(addresses)
  };

  let imported = {
    index: 'imported',
    label: $translate.instant('IMPORTED_ADDRESSES'),
    address: addresses
  };

  $scope.targets = [all].concat(accounts.map(format.origin));
  if (addresses.length) $scope.targets.push(imported);

  $scope.isLast = (t) => t === $scope.targets[$scope.limit - 1];

  $scope.activeCount = (
    Wallet.accounts().filter(a => !a.archived).length +
    Wallet.legacyAddresses().filter(a => !a.archived).length
  );

  $scope.active = $scope.activeCount === 1
    ? all : $scope.targets.filter(t => t.index.toString() === activeIndex)[0];

  let roundDate = (d) => {
    d = new Date(d);
    d.setHours(0);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
  };

  $scope.format = 'dd/MM/yyyy';
  $scope.options = { minDate: new Date(1231024500000), maxDate: new Date() };

  $scope.start = { open: true, date: roundDate(Date.now() - 604800000) };
  $scope.end = { open: true, date: roundDate(Date.now()) };

  $scope.formatDate = (sep, date) => $filter('date')(date, `dd${sep}MM${sep}yyyy`);

  $scope.formatFilename = () => {
    let start = $scope.formatDate('-', $scope.start.date);
    let end = $scope.formatDate('-', $scope.end.date);
    return `history-${start}-${end}.csv`;
  };

  $scope.submit = () => {
    $scope.busy = true;
    let start = $scope.formatDate('/', $scope.start.date);
    let end = $scope.formatDate('/', $scope.end.date);
    let active = $scope.active.address || $scope.active.xpub;
    ExportHistory.fetch(start, end, active)
      .then((data) => {
        $scope.history = data;
        $scope.canTriggerDownload && $scope.$broadcast('download');
      })
      .catch((error) => { Alerts.displayError(error || 'UNKNOWN_ERROR'); })
      .finally(() => $scope.busy = false);
  };

  $scope.$watchGroup(['start.date', 'end.date'], () => {
    $scope.history = null;
  });

  // need to open/close uib-datepicker-popup for it to validate minDate
  $timeout(() => { $scope.start.open = $scope.end.open = false; }, 100);
}
