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
                var orderDate = new Date(item.order.orderdate); // Lấy ngày từ orderdate
                var month = orderDate.getMonth() + 1; // Tháng (1-12)
                var year = orderDate.getFullYear(); // Năm
    
                // Kiểm tra giá trị tháng và năm
                console.log('Order Date:', orderDate, 'Month:', month, 'Year:', year);
    
                return {
                    date: orderDate.toISOString().split('T')[0], // Lưu ngày theo định dạng YYYY-MM-DD
                    month: month, // Lưu tháng
                    year: year, // Lưu năm
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
   // Hàm lọc dữ liệu theo tháng
$scope.filterData = function() {
    console.log('Selected Month:', $scope.selectedMonth); // Kiểm tra giá trị tháng đã chọn
    if (!$scope.selectedMonth) {
        $scope.filteredOrderDetails = $scope.orderdetai; // Hiển thị tất cả nếu không có tháng nào được chọn
    } else {
        // Lọc dữ liệu theo tháng đã chọn
        $scope.filteredOrderDetails = $scope.orderdetai.filter(function(item) {
            console.log('Item Month:', item.month); // Kiểm tra tháng của từng mục
            return item.month === $scope.selectedMonth; // Chỉ lọc theo tháng
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

    console.log('Monthly Stats after calculation:', $scope.monthlyStats); // Kiểm tra thống kê sau khi tính toán
};

    // Hàm vẽ biểu đồ theo tháng
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