var app = angular.module('myApp', []);

app.controller('discountsController', function($scope, $http) {
    $scope.orderdetai = [];
    $scope.filteredOrderDetails = []; // Biến để lưu dữ liệu đã lọc
    $scope.yearlyStats = []; // Thống kê theo năm
    $scope.selectedYear = null; // Năm được chọn

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
            $scope.calculateYearlyStats(); // Tính toán thống kê theo năm
            $scope.renderYearlyChart(); // Vẽ biểu đồ ngay khi dữ liệu được lấy
        })
        .catch(function(error) {
            console.error('Error fetching product details:', error);
        });
    };

    // Hàm tính toán thống kê theo năm
    $scope.calculateYearlyStats = function() {
        $scope.yearlyStats = [];
    
        const statsMap = {}; // Đối tượng chứa thông tin thống kê
    
        $scope.filteredOrderDetails.forEach(function(item) {
            var year = item.year; // Lấy năm
            var categoryName = item.categoryName; // Lấy tên loại sản phẩm
    
            // Tạo key cho mỗi loại sản phẩm trong năm
            var key = `${year}-${categoryName}`;
    
            if (!statsMap[key]) {
                statsMap[key] = {
                    year: year,
                    categoryName: categoryName,
                    totalQuantity: 0,
                    totalRevenue: 0
                };
            }
    
            // Cộng dồn số lượng và doanh thu cho loại sản phẩm
            statsMap[key].totalQuantity += item.quantity; // Cộng dồn số lượng
            statsMap[key].totalRevenue += item.unitprice * item.quantity; // Tổng doanh thu cho từng sản phẩm
        });
    
        // Chuyển đổi đối tượng thành mảng để lưu vào yearlyStats
        $scope.yearlyStats = Object.values(statsMap);
    
        console.log($scope.yearlyStats); // Kiểm tra thống kê sau khi tính toán
    };

    // Hàm lọc dữ liệu theo năm
    $scope.filterDataByYear = function() {
        console.log('Selected Year:', $scope.selectedYear); // Kiểm tra giá trị năm đã chọn
        if (!$scope.selectedYear) {
            $scope.filteredOrderDetails = $scope.orderdetai; // Hiển thị tất cả nếu không có năm nào được chọn
        } else {
            // Lọc dữ liệu theo năm đã chọn
            $scope.filteredOrderDetails = $scope.orderdetai.filter(function(item) {
                console.log('Item Year:', item.year); // Kiểm tra năm của từng mục
                return item.year === $scope.selectedYear; // Chỉ lọc theo năm
            });
        }
    
        // Kiểm tra dữ liệu đã lọc
        console.log('Filtered Order Details:', $scope.filteredOrderDetails);
        
        // Tính toán thống kê và cập nhật biểu đồ
        $scope.calculateYearlyStats();
        $scope.renderYearlyChart(); // Cập nhật biểu đồ
    };

    // Hàm vẽ biểu đồ theo năm
    $scope.renderYearlyChart = function() {
        // Nếu không có dữ liệu, không vẽ biểu đồ
        if ($scope.yearlyStats.length === 0) {
            document.getElementById("yearly-bar-chart").innerHTML = "<p>Không có dữ liệu để hiển thị biểu đồ.</p>";
            return;
        }
    
        // Xóa nội dung cũ
        const chartDiv = document.getElementById("yearly-bar-chart");
        chartDiv.innerHTML = ""; // Xóa nội dung cũ trước khi vẽ biểu đồ mới
    
        var options = {
            series: [{
                name: 'Tổng Số Lượng',
                data: $scope.yearlyStats.map(stat => stat.totalQuantity),
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
                categories: $scope.yearlyStats.map(stat => stat.year),
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
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Gọi hàm để lấy dữ liệu
    $scope.getDiscounts();
});