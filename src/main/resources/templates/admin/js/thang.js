var app = angular.module('myApp', []);

app.controller('discountsController', function($scope, $http) {
    $scope.orderdetai = [];
    $scope.filteredOrderDetails = []; // Dữ liệu đã lọc
    $scope.monthlyStats = []; // Thống kê theo tháng
    $scope.selectedMonth = null; // Tháng được chọn
    $scope.statusPayments = []; // Lưu trạng thái thanh toán

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

    // Hàm lấy dữ liệu đơn hàng từ API mới
    $scope.getDiscounts = function() {
        $http.get('http://localhost:8080/beesixcake/api/order')
        .then(function(response) {  
            console.log(response.data); // Kiểm tra dữ liệu nhận được
            $scope.orderdetai = response.data.map(function(item) {
                var orderDate = new Date(item.orderdate); // Lấy ngày từ orderdate
                var month = orderDate.getMonth() + 1; // Tháng (1-12)
                var year = orderDate.getFullYear(); // Năm

                return {
                    date: orderDate.toISOString().split('T')[0], // Lưu ngày theo định dạng YYYY-MM-DD
                    month: month, // Lưu tháng
                    year: year, // Lưu năm
                    // Thông tin đơn hàng
                    addressDetail: item.addressdetail,
                    shipFee: item.shipfee,
                    total: item.total,
                    account: item.account.fullname, // Tên người dùng
                    paymentMethod: item.payment.paymentname, // Phương thức thanh toán
                    statusId: item.idstatuspay, // Lưu ID trạng thái thanh toán
                };
            });
            $scope.filteredOrderDetails = $scope.orderdetai.filter(item => item.statusId === 2); // Chỉ giữ sản phẩm đã thanh toán
            $scope.calculateMonthlyStats(); // Tính toán thống kê theo tháng
            $scope.renderMonthlyChart(); // Vẽ biểu đồ ngay khi dữ liệu được lấy
        })
        .catch(function(error) {
            console.error('Error fetching order details:', error);
        });
    };

    // Hàm lọc dữ liệu theo tháng
    $scope.filterData = function() {
        console.log('Selected Month:', $scope.selectedMonth); // Kiểm tra giá trị tháng đã chọn
        if (!$scope.selectedMonth) {
            // Nếu không có tháng nào được chọn, hiển thị tất cả
            $scope.filteredOrderDetails = $scope.orderdetai.filter(item => item.statusId === 2); // Lọc sản phẩm đã thanh toán
        } else {
            // Lọc dữ liệu theo tháng đã chọn và trạng thái đã thanh toán
            $scope.filteredOrderDetails = $scope.orderdetai.filter(function(item) {
                return item.month === $scope.selectedMonth && item.statusId === 2; // Chỉ lấy sản phẩm đã thanh toán
            });
        }

        // Kiểm tra dữ liệu đã lọc
        console.log('Filtered Order Details:', $scope.filteredOrderDetails);
        
        // Tính toán thống kê và cập nhật biểu đồ
        $scope.calculateMonthlyStats();
        console.log('Monthly Stats:', $scope.monthlyStats); // Kiểm tra thống kê
        $scope.renderMonthlyChart(); // Cập nhật biểu đồ
    };

    // Hàm tính toán thống kê theo tháng
    $scope.calculateMonthlyStats = function() {
        $scope.monthlyStats = [];

        // Nhóm dữ liệu theo tháng
        const statsMap = {}; // Đối tượng chứa thông tin thống kê

        $scope.filteredOrderDetails.forEach(function(item) {
            var monthYear = `${item.year}-${item.month < 10 ? '0' + item.month : item.month}`; // Định dạng "YYYY-MM"

            if (!statsMap[monthYear]) {
                statsMap[monthYear] = {
                    monthYear: monthYear,
                    totalOrders: 0,
                    totalRevenue: 0
                };
            }

            // Cộng dồn số lượng và doanh thu cho đơn hàng
            statsMap[monthYear].totalOrders += 1; // Mỗi đơn hàng là một order
            statsMap[monthYear].totalRevenue += item.total; // Tổng doanh thu từ total
        });

        // Chuyển đổi đối tượng thành mảng để lưu vào monthlyStats
        $scope.monthlyStats = Object.values(statsMap);

        console.log('Monthly Stats after calculation:', $scope.monthlyStats); // Kiểm tra thống kê sau khi tính toán
    };

    // Hàm vẽ biểu đồ theo tháng
    $scope.renderMonthlyChart = function() {
        // Nếu không có dữ liệu, không vẽ biểu đồ
        if ($scope.monthlyStats.length === 0) {
            document.getElementById("monthly-bar-chart").innerHTML = "<p>Không có dữ liệu để hiển thị biểu đồ.</p>";
            return;
        }

        // Nếu có dữ liệu, xóa thông báo cũ
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
    $scope.getStatusPayments(); // Gọi hàm lấy trạng thái thanh toán
    $scope.getDiscounts(); // Gọi hàm lấy dữ liệu đơn hàng
});