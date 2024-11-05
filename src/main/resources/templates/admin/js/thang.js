var app = angular.module('myApp', []);

app.controller('discountsController', function($scope, $http) {
    $scope.orderdetai = [];
    $scope.filteredOrderDetails = []; // Biến để lưu dữ liệu đã lọc
    $scope.monthlyStats = []; // Thống kê theo tháng
    $scope.selectedMonth = null; // Tháng được chọn

    // Hàm lấy dữ liệu giảm giá
    $scope.getDiscounts = function() {
        $http.get('http://localhost:8080/beesixcake/api/orderdetail')
        .then(function(response) {  
            console.log(response.data); // Kiểm tra dữ liệu nhận được
            $scope.orderdetai = response.data.map(function(item) {
                var orderDate = new Date(item.order.orderdate);
                return {
                    date: orderDate.toISOString().split('T')[0], // Lưu ngày theo định dạng YYYY-MM-DD
                    month: orderDate.getMonth() + 1, // Tháng (1-12)
                    year: orderDate.getFullYear(), // Năm
                    name: item.productdetail.product.productname,
                    img: item.productdetail.product.img,
                    categoryName: item.productdetail.product.category.categoryname,
                    sz: item.productdetail.size.sizename,
                    price: item.unitprice,
                    quantity: item.productdetail.quantityinstock,
                    unitprice: item.productdetail.unitprice,
                    description: item.productdetail.product.description
                };
            });
            $scope.filteredOrderDetails = $scope.orderdetai; // Khởi tạo dữ liệu đã lọc
            $scope.calculateMonthlyStats(); // Tính toán thống kê theo tháng
            $scope.renderMonthlyChart(); // Vẽ biểu đồ ngay khi dữ liệu được lấy
        })
        .catch(function(error) {
            console.error('Error fetching product details:', error);
        });
    };

    // Hàm tính toán thống kê theo tháng
    $scope.calculateMonthlyStats = function() {
        $scope.monthlyStats = [];
    
        // Nhóm dữ liệu theo tháng
        $scope.filteredOrderDetails.forEach(function(item) {
            var monthYear = `${item.year}-${item.month < 10 ? '0' + item.month : item.month}`; // Định dạng "YYYY-MM"
            
            // Tạo hoặc cập nhật đối tượng thống kê cho tháng
            var stat = $scope.monthlyStats.find(s => s.monthYear === monthYear);
            if (!stat) {
                stat = { monthYear: monthYear, totalQuantity: 0, totalRevenue: 0 };
                $scope.monthlyStats.push(stat);
            }
            stat.totalQuantity += item.quantity;
            stat.totalRevenue += item.unitprice * item.quantity; // Tổng doanh thu cho từng sản phẩm
        });
    
        console.log($scope.monthlyStats); // Kiểm tra thống kê sau khi tính toán
    };

    // Hàm lọc dữ liệu theo tháng
    $scope.filterData = function() {
        if (!$scope.selectedMonth) {
            $scope.filteredOrderDetails = $scope.orderdetai; // Hiển thị tất cả nếu không có tháng nào được chọn
            $scope.calculateMonthlyStats(); // Tính toán thống kê cho tất cả dữ liệu
            $scope.renderMonthlyChart(); // Cập nhật biểu đồ
            return;
        }
    
        // Lọc dữ liệu theo tháng đã chọn và năm 2024
        $scope.filteredOrderDetails = $scope.orderdetai.filter(function(item) {
            return item.month === $scope.selectedMonth && item.year === 2024; // Đảm bảo năm cũng được tính
        });
    
        console.log($scope.filteredOrderDetails); // Kiểm tra dữ liệu đã lọc
    
        // Tính toán thống kê theo tháng sau khi lọc dữ liệu
        $scope.calculateMonthlyStats();
        $scope.renderMonthlyChart(); // Cập nhật biểu đồ
    };

    // Hàm vẽ biểu đồ theo tháng
  // Hàm vẽ biểu đồ theo tháng
$scope.renderMonthlyChart = function() {
    // Nếu không có dữ liệu, không vẽ biểu đồ
    if ($scope.monthlyStats.length === 0) {
        document.getElementById("monthly-bar-chart").innerHTML = "<p>Không có dữ liệu để hiển thị biểu đồ.</p>";
        return;
    }

    var options = {
        series: [{
            name: 'Tổng Số Lượng',
            data: $scope.monthlyStats.map(stat => stat.totalQuantity),
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
    $scope.getDiscounts();
});