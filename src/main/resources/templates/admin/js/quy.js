var app = angular.module('myApp', []);

app.controller('discountsController', function($scope, $http) {
    $scope.orders = []; // Thay đổi tên biến thành orders
    $scope.filteredOrderDetails = []; // Biến để lưu dữ liệu đã lọc
    $scope.quarterlyStats = []; // Thống kê theo quý
    $scope.startDate = null; // Ngày bắt đầu
    $scope.endDate = null; // Ngày kết thúc

    // Hàm lấy dữ liệu đơn hàng
    $scope.getOrders = function() {
        $http.get('http://localhost:8080/beesixcake/api/order')
        .then(function(response) {
            console.log(response.data); // Kiểm tra dữ liệu nhận được
            $scope.orders = response.data.map(function(item) {
                var orderDate = new Date(item.orderdate); // Lấy ngày đặt hàng từ đơn hàng
                return {
                    date: orderDate.toISOString().split('T')[0], // Lưu ngày theo định dạng YYYY-MM-DD
                    month: orderDate.getMonth() + 1, // Tháng (1-12)
                    year: orderDate.getFullYear(), // Năm
                    total: item.total, // Tổng tiền từ đơn hàng
                    statusId: item.idstatuspay // Lưu ID trạng thái thanh toán
                };
            });

            // Giả sử ID trạng thái "đã thanh toán" là 2
            $scope.filteredOrderDetails = $scope.orders.filter(item => item.statusId === 2); // Chỉ giữ sản phẩm đã thanh toán
            $scope.calculateQuarterlyStats(); // Tính toán thống kê theo quý
            $scope.renderChart(); // Vẽ biểu đồ ngay khi dữ liệu được lấy
        })
        .catch(function(error) {
            console.error('Error fetching orders:', error);
        });
    };

    // Hàm tính toán thống kê theo quý
    $scope.calculateQuarterlyStats = function() {
        $scope.quarterlyStats = [];

        // Nhóm dữ liệu theo quý
        $scope.filteredOrderDetails.forEach(function(item) {
            var quarter = Math.ceil(item.month / 3); // Tính quý
            var year = item.year;

            // Tạo hoặc cập nhật đối tượng thống kê cho quý
            var stat = $scope.quarterlyStats.find(s => s.quarter === quarter && s.year === year);
            if (!stat) {
                stat = { quarter: quarter, year: year, totalQuantity: 0, totalRevenue: 0 };
                $scope.quarterlyStats.push(stat);
            }
            stat.totalQuantity += 1; // Tăng số lượng đơn hàng
            stat.totalRevenue += item.total; // Cộng tổng tiền từ trường total
        });

        console.log('Quarterly Stats:', $scope.quarterlyStats); // Kiểm tra dữ liệu thống kê
    };

    // Hàm xuất dữ liệu ra Excel
    $scope.exportToExcel = function() {
        const worksheet = XLSX.utils.json_to_sheet($scope.filteredOrderDetails.map(item => ({
            'Ngày tạo': item.date,
            'Tổng tiền': item.total
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Order Details");

        // Xuất file
        XLSX.writeFile(workbook, 'order_details.xlsx');
    };

    // Hàm lọc dữ liệu theo ngày
    $scope.filterData = function() {
        $scope.filteredOrderDetails = $scope.orders.filter(function(item) {
            var itemDate = new Date(item.date);
            var start = $scope.startDate ? new Date($scope.startDate) : null;
            var end = $scope.endDate ? new Date($scope.endDate) : null;

            // Đặt giờ cho ngày bắt đầu và ngày kết thúc
            if (start) {
                start.setHours(0, 0, 0, 0); // Đầu ngày
            }
            if (end) {
                end.setHours(23, 59, 59, 999); // Cuối ngày
            }

            // Kiểm tra xem ngày sản phẩm có nằm trong khoảng không
            if (start && end) {
                return itemDate >= start && itemDate <= end;
            } else if (start) {
                return itemDate >= start;
            } else if (end) {
                return itemDate <= end;
            } else {
                return true; // Nếu không có ngày nào được chọn thì hiển thị tất cả
            }
        });

        // Tính toán thống kê theo quý sau khi lọc dữ liệu
        $scope.calculateQuarterlyStats();
        // Cập nhật biểu đồ sau khi lọc dữ liệu
        $scope.renderChart();
    };

    // Hàm vẽ biểu đồ
    $scope.renderChart = function() {
        // Nếu không có dữ liệu, không vẽ biểu đồ
        if ($scope.quarterlyStats.length === 0) {
            document.getElementById("bar-chart").innerHTML = "<p>Không có dữ liệu để hiển thị biểu đồ.</p>"; // Thông báo nếu không có dữ liệu
            return;
        }

        var options = {
            series: [{
                name: 'Tổng Số Lượng',
                data: $scope.quarterlyStats.map(stat => stat.totalQuantity), // Tổng số lượng cho từng quý
            }],
            chart: {
                type: 'bar',
                height: 300,
                width: '100%' // Đặt chiều rộng biểu đồ là 100%
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '50%',
                }
            },
            xaxis: {
                categories: $scope.quarterlyStats.map(stat => `Quý ${stat.quarter} ${stat.year}`), // Tên quý
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

        var chart = new ApexCharts(document.querySelector("#bar-chart"), options);
        chart.render();
    };

    // Hàm định dạng tiền tệ
    $scope.formatCurrency = function(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Gọi hàm để lấy dữ liệu
    $scope.getOrders(); // Gọi hàm lấy dữ liệu từ API order
});