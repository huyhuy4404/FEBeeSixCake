
var app = angular.module('myApp', []);

var app = angular.module('myApp', []);

app.controller('discountsController', function($scope, $http) {
    $scope.orderdetai = [];
    $scope.filteredOrderDetails = []; // Dữ liệu đã lọc
    $scope.dailyStats = []; // Thống kê theo ngày
    $scope.selectedDate = null; // Ngày được chọn
    $scope.statusPayments = []; // Lưu trạng thái thanh toán
    $scope.availableDates = []; // Danh sách các ngày có sẵn

    // Hàm lấy dữ liệu trạng thái thanh toán
    $scope.getStatusPayments = function() {
        $http.get('http://localhost:8080/beesixcake/api/statuspay')
        .then(function(response) {
            $scope.statusPayments = response.data; // Lưu danh sách trạng thái thanh toán
            console.log('Trạng thái thanh toán:', $scope.statusPayments);
        })
        .catch(function(error) {
            console.error('Lỗi khi lấy dữ liệu trạng thái thanh toán:', error);
        });
    };

    // Hàm lấy dữ liệu đơn hàng từ API
    $scope.getDiscounts = function() {
        $http.get('http://localhost:8080/beesixcake/api/order')
        .then(function(response) {  
            console.log(response.data);
            $scope.orderdetai = response.data.map(function(item) {
                var orderDate = new Date(item.orderdate);
                return {
                    date: orderDate.toISOString().split('T')[0], // Ngày theo định dạng YYYY-MM-DD
                    total: item.total,
                    statusId: item.idstatuspay,
                };
            });
            
            // Tạo danh sách các ngày có sẵn với định dạng "YYYY DD"
            $scope.availableDates = [...new Set($scope.orderdetai.map(item => {
                const dateParts = item.date.split('-'); // Tách thành phần ngày
                return `${dateParts[0]} ${dateParts[2]}`; // Hiển thị năm trước rồi đến ngày
            }))];

            $scope.filteredOrderDetails = $scope.orderdetai.filter(item => item.statusId === 2);
            $scope.calculateDailyStats();
            $scope.renderDailyChart();
        })
        .catch(function(error) {
            console.error('Lỗi khi lấy dữ liệu đơn hàng:', error);
        });
    };

    // Hàm lọc dữ liệu theo ngày
    $scope.filterData = function() {
        console.log('Ngày đã chọn:', $scope.selectedDate);
        if (!$scope.selectedDate) {
            $scope.filteredOrderDetails = $scope.orderdetai.filter(item => item.statusId === 2);
        } else {
            $scope.filteredOrderDetails = $scope.orderdetai.filter(function(item) {
                const dateParts = item.date.split('-'); // Tách thành phần ngày
                const formattedDate = `${dateParts[0]} ${dateParts[2]}`; // Định dạng lại ngày
                return formattedDate === $scope.selectedDate && item.statusId === 2;
            });
        }

        console.log('Chi tiết đơn hàng đã lọc:', $scope.filteredOrderDetails);
        $scope.calculateDailyStats();
        $scope.renderDailyChart();
    };

    // Hàm tính toán thống kê theo ngày
    $scope.calculateDailyStats = function() {
        $scope.dailyStats = [];
        const statsMap = {};
        $scope.filteredOrderDetails.forEach(function(item) {
            const dateParts = item.date.split('-'); // Tách thành phần ngày
            const formattedDate = `${dateParts[0]} ${dateParts[2]}`; // Định dạng lại ngày
            if (!statsMap[formattedDate]) {
                statsMap[formattedDate] = {
                    date: formattedDate,
                    totalOrders: 0,
                    totalRevenue: 0
                };
            }
    
            statsMap[formattedDate].totalOrders += 1;
            statsMap[formattedDate].totalRevenue += item.total;
        });

        $scope.dailyStats = Object.values(statsMap);
        console.log('Thống kê hàng ngày sau khi tính toán:', $scope.dailyStats);
    };

    // Hàm vẽ biểu đồ theo ngày
    $scope.renderDailyChart = function() {
        if ($scope.dailyStats.length === 0) {
            document.getElementById("daily-bar-chart").innerHTML = "<p>Không có dữ liệu để hiển thị biểu đồ.</p>";
            return;
        }

        document.getElementById("daily-bar-chart").innerHTML = "";

        var options = {
            series: [{
                name: 'Tổng Đơn Hàng',
                data: $scope.dailyStats.map(stat => stat.totalOrders),
            }],
            chart: {
                type: 'bar',
                height: 300,
                width: '100%'
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '50%',
                }
            },
            xaxis: {
                categories: $scope.dailyStats.map(stat => stat.date),
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

        var chart = new ApexCharts(document.querySelector("#daily-bar-chart"), options);
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