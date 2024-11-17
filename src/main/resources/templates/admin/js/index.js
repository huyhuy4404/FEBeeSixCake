var app = angular.module('myApp', []);


var app = angular.module('myApp', []);

app.controller('index', function($scope, $http) {
    $scope.orders = []; // Danh sách đơn hàng
    $scope.filteredOrders = []; // Danh sách đơn hàng đã lọc
    $scope.totalRevenue = 0; // Tổng doanh thu
    $scope.totalOrdersCount = 0; // Tổng số đơn hàng
    $scope.statusPayments = []; // Biến lưu trạng thái thanh toán

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
                return {
                    date: new Date(item.orderdate).toISOString().split('T')[0],
                    total: item.total, // Lưu tổng tiền từ đơn hàng
                    statusId: item.idstatuspay // Lưu ID trạng thái thanh toán
                };
            });
            $scope.filteredOrders = $scope.orders.filter(order => order.statusId === 2); // Lọc đơn hàng đã thanh toán
            $scope.calculateTotals(); // Tính tổng tiền và số đơn hàng
        })
        .catch(function(error) {
            console.error('Error fetching orders:', error);
        });
    };

    // Hàm tính tổng tiền và tổng số đơn hàng
    $scope.calculateTotals = function() {
        $scope.totalRevenue = $scope.filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        $scope.totalOrdersCount = $scope.filteredOrders.length;
        console.log('Tổng doanh thu:', $scope.totalRevenue); // Kiểm tra tổng doanh thu
        console.log('Tổng số đơn hàng:', $scope.totalOrdersCount); // Kiểm tra tổng số đơn hàng
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