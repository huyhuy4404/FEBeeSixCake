var app = angular.module('myApp', []);

app.controller('discountsController', function($scope, $http) {
    $scope.orders = []; // Thay đổi tên biến thành orders
    $scope.filteredOrders = [];
    $scope.yearlyStats = [];
    $scope.monthlyStats = [];
    $scope.selectedYear = null;
    $scope.statusPayments = []; // Biến lưu trạng thái thanh toán
    $scope.years = []; // Danh sách các năm

    // Hàm lấy dữ liệu trạng thái thanh toán
    $scope.getStatusPayments = function() {
        $http.get('http://localhost:8080/beesixcake/api/statuspay')
        .then(function(response) {
            $scope.statusPayments = response.data; // Lưu danh sách trạng thái thanh toán
            console.log('Status Payments:', $scope.statusPayments); // Kiểm tra dữ liệu
        })
        .catch(function(error) {
            console.error('Error fetching status payments:', error);
        });
    };

    // Hàm lấy dữ liệu đơn hàng
    $scope.getOrders = function() {
        $http.get('http://localhost:8080/beesixcake/api/order')
        .then(function(response) {  
            console.log(response.data); // Kiểm tra dữ liệu nhận được
            $scope.orders = response.data.map(function(item) {
                var orderDate = new Date(item.orderdate); // Lấy ngày đặt hàng từ đơn hàng
                var year = orderDate.getFullYear();

                return {
                    date: orderDate.toISOString().split('T')[0],
                    year: year,
                    total: item.total, // Lưu tổng tiền từ đơn hàng
                    statusId: item.idstatuspay // Lưu ID trạng thái thanh toán
                };
            });
            $scope.filteredOrders = $scope.orders; // Khởi tạo filteredOrders
            $scope.extractYears(); // Lấy danh sách các năm
            $scope.filterDataByYear(); // Lọc dữ liệu ngay sau khi tải
            $scope.calculateYearlyStats();
            $scope.calculateMonthlyStats(); // Gọi hàm tính toán thống kê theo tháng
        })
        .catch(function(error) {
            console.error('Error fetching orders:', error);
        });
    };

    // Hàm lấy danh sách các năm
    $scope.extractYears = function() {
        $scope.years = [...new Set($scope.orders.map(item => item.year))]; // Lấy danh sách các năm duy nhất
    };

    // Hàm tính toán thống kê theo năm
    $scope.calculateYearlyStats = function() {
        $scope.yearlyStats = [];
        const statsMap = {};

        // Nhóm dữ liệu theo năm
        $scope.filteredOrders.forEach(function(item) {
            var year = item.year; // Lấy năm

            // Tạo key nhóm theo năm
            if (!statsMap[year]) {
                statsMap[year] = {
                    year: year,
                    totalOrders: 0,       // Số lượng đơn hàng
                    totalRevenue: 0       // Tổng tiền
                };
            }

            // Cộng dồn số lượng đơn hàng và doanh thu
            statsMap[year].totalOrders += 1; // Tăng số lượng đơn hàng
            statsMap[year].totalRevenue += item.total; // Cộng tổng tiền từ trường total
        });

        // Chuyển đổi đối tượng thành mảng để lưu vào yearlyStats
        $scope.yearlyStats = Object.values(statsMap);
        console.log('Yearly Stats after calculation:', $scope.yearlyStats); // Kiểm tra thống kê sau khi tính toán
    };

    // Hàm tính toán thống kê theo tháng
    $scope.calculateMonthlyStats = function() {
        $scope.monthlyStats = [];
        const statsMap = {};

        // Nhóm dữ liệu theo tháng
        $scope.filteredOrders.forEach(function(item) {
            var orderDate = new Date(item.date);
            var month = orderDate.getMonth() + 1; // Tháng (1-12)
            var year = orderDate.getFullYear(); // Năm
            var monthYear = `${year}-${month < 10 ? '0' + month : month}`; // Định dạng "YYYY-MM"

            // Tạo key cho từng tháng
            if (!statsMap[monthYear]) {
                statsMap[monthYear] = {
                    monthYear: monthYear,
                    totalOrders: 0,       // Số lượng đơn hàng
                    totalRevenue: 0       // Tổng tiền
                };
            }

            // Cộng dồn số lượng đơn hàng và doanh thu
            statsMap[monthYear].totalOrders += 1; // Tăng số lượng đơn hàng
            statsMap[monthYear].totalRevenue += item.total; // Cộng tổng tiền từ trường total
        });

        // Chuyển đổi đối tượng thành mảng để lưu vào monthlyStats
        $scope.monthlyStats = Object.values(statsMap);
        console.log('Monthly Stats after calculation:', $scope.monthlyStats); // Kiểm tra thống kê sau khi tính toán
    };

    // Hàm lọc dữ liệu theo năm và trạng thái
    $scope.filterDataByYear = function() {
        console.log('Selected Year:', $scope.selectedYear);
        
        // Lọc tất cả sản phẩm đã thanh toán (idstatuspay = 2)
        $scope.filteredOrders = $scope.orders.filter(function(item) {
            return item.statusId === 2; // Chỉ lấy sản phẩm đã thanh toán
        });
        
        // Nếu có chọn năm, lọc tiếp theo năm
        if ($scope.selectedYear) {
            $scope.filteredOrders = $scope.filteredOrders.filter(function(item) {
                return item.year == $scope.selectedYear; // Sử dụng == để so sánh kiểu dữ liệu
            });
        }

        console.log('Filtered Order Details:', $scope.filteredOrders);
        $scope.calculateYearlyStats();
        $scope.calculateMonthlyStats(); // Gọi hàm tính toán thống kê theo tháng
        $scope.renderYearlyChart();
    };

    // Hàm vẽ biểu đồ theo năm
    $scope.renderYearlyChart = function() {
        if ($scope.yearlyStats.length === 0) {
            document.getElementById("yearly-bar-chart").innerHTML = "<p>Không có dữ liệu để hiển thị biểu đồ.</p>";
            return;
        }

        const chartDiv = document.getElementById("yearly-bar-chart");
        chartDiv.innerHTML = "";

        var options = {
            series: [{
                name: 'Tổng Số Lượng',
                data: $scope.yearlyStats.map(stat => stat.totalOrders),
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
                categories: $scope.yearlyStats.map(stat => stat.year), // Hiển thị năm
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

        var chart = new ApexCharts(chartDiv, options);
        chart.render();
    };

    // Hàm định dạng tiền tệ
    $scope.formatCurrency = function(amount) {
        if (isNaN(amount)) {
            return '0 ₫'; // Hoặc một giá trị mặc định
        }
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Gọi hàm để lấy dữ liệu
    $scope.getStatusPayments(); // Lấy dữ liệu trạng thái thanh toán
    $scope.getOrders(); // Lấy dữ liệu đơn hàng
});