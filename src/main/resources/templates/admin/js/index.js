var app = angular.module('myApp', []);


var app = angular.module('myApp', []);
app.controller('index', function($scope, $http) {
    $scope.orders = []; // Danh sách đơn hàng
    $scope.filteredOrders = []; // Danh sách đơn hàng đã lọc
    $scope.totalRevenue = 0; // Tổng doanh thu
    $scope.totalOrdersCount = 0; // Tổng số đơn hàng
    $scope.statusPayments = []; // Biến lưu trạng thái thanh toán
    $scope.inventory = []; // Danh sách tồn kho theo loại sản phẩm

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

    // Hàm lấy dữ liệu tồn kho
    $scope.getInventory = function() {
        $http.get('http://localhost:8080/beesixcake/api/inventory')
        .then(function(response) {
            $scope.inventory = response.data; // Lưu danh sách tồn kho
            console.log('Inventory:', $scope.inventory); // Kiểm tra dữ liệu
            $scope.calculateInventoryTotals(); // Tính tổng tồn kho
            $scope.renderInventoryChart(); // Vẽ biểu đồ tồn kho
        })
        .catch(function(error) {
            console.error('Error fetching inventory:', error);
        });
    };

    // Hàm tính tổng tiền và tổng số đơn hàng
    $scope.calculateTotals = function() {
        $scope.totalRevenue = $scope.filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        $scope.totalOrdersCount = $scope.filteredOrders.length;
        console.log('Tổng doanh thu:', $scope.totalRevenue); // Kiểm tra tổng doanh thu
        console.log('Tổng số đơn hàng:', $scope.totalOrdersCount); // Kiểm tra tổng số đơn hàng
    };

    // Hàm tính tổng tồn kho
    $scope.calculateInventoryTotals = function() {
        const totalInventory = $scope.inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
        console.log('Tổng số lượng tồn kho:', totalInventory); // Kiểm tra tổng số lượng tồn kho
    };

    // Hàm vẽ biểu đồ tồn kho
    $scope.renderInventoryChart = function() {
        const categories = $scope.inventory.map(item => item.categoryName);
        const quantities = $scope.inventory.map(item => item.quantity);

        var options = {
            series: [{
                name: 'Số lượng tồn kho',
                data: quantities
            }],
            chart: {
                type: 'bar',
                height: 350
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    endingShape: 'rounded'
                }
            },
            dataLabels: {
                enabled: false
            },
            xaxis: {
                categories: categories,
            }
        };

        var chart = new ApexCharts(document.querySelector("#inventory-chart"), options);
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
    $scope.getInventory(); // Lấy dữ liệu tồn kho
});