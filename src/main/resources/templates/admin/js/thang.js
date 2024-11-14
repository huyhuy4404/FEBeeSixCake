var app = angular.module('myApp', []);

app.controller('discountsController', function($scope, $http) {
    $scope.orderdetai = [];
    $scope.filteredOrderDetails = []; // Dữ liệu đã lọc
    $scope.monthlyStats = []; // Thống kê theo tháng
    $scope.selectedDate = null; // Ngày được chọn
    $scope.statusPayments = []; // Lưu trạng thái thanh toán

    // Hàm lấy dữ liệu trạng thái thanh toán
    $scope.getStatusPayments = function() {
        $http.get('http://localhost:8080/beesixcake/api/statuspay')
        .then(function(response) {
            $scope.statusPayments = response.data; // Lưu danh sách trạng thái thanh toán
            console.log('Status Payments:', $scope.statusPayments);
        })
        .catch(function(error) {
            console.error('Error fetching status payments:', error);
        });
    };

    // Hàm lấy dữ liệu đơn hàng từ API mới
    $scope.getDiscounts = function() {
        $http.get('http://localhost:8080/beesixcake/api/order')
        .then(function(response) {  
            console.log(response.data);
            $scope.orderdetai = response.data.map(function(item) {
                var orderDate = new Date(item.orderdate);
                var month = orderDate.getMonth() + 1;
                var year = orderDate.getFullYear();

                return {
                    date: orderDate.toISOString().split('T')[0],
                    month: month,
                    year: year,
                    addressDetail: item.addressdetail,
                    shipFee: item.shipfee,
                    total: item.total,
                    account: item.account.fullname,
                    paymentMethod: item.payment.paymentname,
                    statusId: item.idstatuspay,
                };
            });
            $scope.filteredOrderDetails = $scope.orderdetai.filter(item => item.statusId === 2);
            $scope.calculateMonthlyStats();
            $scope.renderMonthlyChart();
        })
        .catch(function(error) {
            console.error('Error fetching order details:', error);
        });
    };

    // Hàm lọc dữ liệu theo ngày
    $scope.filterData = function() {
        console.log('Selected Date:', $scope.selectedDate);
        if (!$scope.selectedDate) {
            $scope.filteredOrderDetails = $scope.orderdetai.filter(item => item.statusId === 2);
        } else {
            var selectedDateObj = new Date($scope.selectedDate);
            var selectedMonth = selectedDateObj.getMonth() + 1;
            var selectedYear = selectedDateObj.getFullYear();

            $scope.filteredOrderDetails = $scope.orderdetai.filter(function(item) {
                return item.month === selectedMonth && item.year === selectedYear && item.statusId === 2;
            });
        }

        console.log('Filtered Order Details:', $scope.filteredOrderDetails);
        $scope.calculateMonthlyStats();
        console.log('Monthly Stats:', $scope.monthlyStats);
        $scope.renderMonthlyChart();
    };

    // Hàm tính toán thống kê theo tháng
    $scope.calculateMonthlyStats = function() {
        $scope.monthlyStats = [];
        const statsMap = {};

        $scope.filteredOrderDetails.forEach(function(item) {
            var monthYear = `${item.year}-${item.month < 10 ? '0' + item.month : item.month}`;

            if (!statsMap[monthYear]) {
                statsMap[monthYear] = {
                    monthYear: monthYear,
                    totalOrders: 0,
                    totalRevenue: 0
                };
            }

            statsMap[monthYear].totalOrders += 1;
            statsMap[monthYear].totalRevenue += item.total;
        });

        $scope.monthlyStats = Object.values(statsMap);
        console.log('Monthly Stats after calculation:', $scope.monthlyStats);
    };

    // Hàm vẽ biểu đồ theo tháng
    $scope.renderMonthlyChart = function() {
        if ($scope.monthlyStats.length === 0) {
            document.getElementById("monthly-bar-chart").innerHTML = "<p>Không có dữ liệu để hiển thị biểu đồ.</p>";
            return;
        }

        document.getElementById("monthly-bar-chart").innerHTML = "";

        var options = {
            series: [{
                name: 'Tổng Đơn Hàng',
                data: $scope.monthlyStats.map(stat => stat.totalOrders),
            }],
            chart: {
                type: 'bar',
                height: 300,
                width: 300
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '50%',
                }
            },
            xaxis: {
                categories: $scope.monthlyStats.map(stat => stat.monthYear),
            },
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200,
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }]
        };

        var chart = new ApexCharts(document.querySelector("#monthly-bar-chart"), options);
        chart.render();
    };

    // Hàm định dạng tiền tệ
    $scope.formatCurrency = function(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Gọi hàm để lấy dữ liệu
    $scope.getStatusPayments();
    $scope.getDiscounts();
});