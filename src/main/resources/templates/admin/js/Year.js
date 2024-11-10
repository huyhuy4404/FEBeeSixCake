var app = angular.module('myApp', []);

app.controller('discountsController', function($scope, $http) {
    $scope.orderdetai = [];
    $scope.filteredOrderDetails = [];
    $scope.yearlyStats = [];
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

    // Hàm lấy dữ liệu sản phẩm
    $scope.getDiscounts = function() {
        $http.get('http://localhost:8080/beesixcake/api/orderdetail')
        .then(function(response) {  
            console.log(response.data); // Kiểm tra dữ liệu nhận được
            $scope.orderdetai = response.data.map(function(item) {
                var orderDate = new Date(item.order.orderdate);
                var month = orderDate.getMonth() + 1;
                var year = orderDate.getFullYear();

                return {
                    date: orderDate.toISOString().split('T')[0],
                    month: month,
                    year: year,
                    year: year,
                    name: item.productdetail.product.productname,
                    img: item.productdetail.product.img,
                    categoryName: item.productdetail.product.category.categoryname,
                    sz: item.productdetail.size.sizename,
                    price: item.unitprice,
                    quantity: item.quantity,
                    unitprice: item.productdetail.unitprice,
                    description: item.productdetail.product.description,
                    statusId: item.order.idstatuspay // Lưu ID trạng thái thanh toán
                };
            });
            $scope.filteredOrderDetails = $scope.orderdetai; // Khởi tạo filteredOrderDetails
            $scope.extractYears(); // Lấy danh sách các năm
            $scope.filterDataByYear(); // Lọc dữ liệu ngay sau khi tải
            $scope.calculateYearlyStats();
            $scope.renderYearlyChart();
        })
        .catch(function(error) {
            console.error('Error fetching product details:', error);
        });
    };

    // Hàm lấy danh sách các năm
    $scope.extractYears = function() {
        $scope.years = [...new Set($scope.orderdetai.map(item => item.year))]; // Lấy danh sách các năm duy nhất
    };

    // Hàm tính toán thống kê theo năm và nhóm sản phẩm
    $scope.calculateYearlyStats = function() {
        $scope.yearlyStats = [];
        const statsMap = {};

        // Nhóm sản phẩm theo năm và tên sản phẩm
        $scope.filteredOrderDetails.forEach(function(item) {
            var year = item.year;
            var productName = item.categoryName; // Lấy tên sản phẩm

            // Tạo key nhóm theo năm và tên sản phẩm
            var key = `${year}-${productName}`;

            if (!statsMap[key]) {
                statsMap[key] = {
                    year: year,
                    productName: productName, // Tên sản phẩm
                    totalQuantity: 0,
                    totalRevenue: 0,
                };
            }

            // Cộng dồn số lượng và doanh thu cho sản phẩm trùng nhau
            statsMap[key].totalQuantity += item.quantity;
            statsMap[key].totalRevenue += item.unitprice * item.quantity;
        });

        // Chuyển đổi lại thành mảng
        $scope.yearlyStats = Object.values(statsMap);
        console.log($scope.yearlyStats);
    };

    // Hàm lọc dữ liệu theo năm và trạng thái
   // Hàm lọc dữ liệu theo năm và trạng thái
$scope.filterDataByYear = function() {
    console.log('Selected Year:', $scope.selectedYear);
    
    // Lọc tất cả sản phẩm đã thanh toán (idstatuspay = 2)
    $scope.filteredOrderDetails = $scope.orderdetai.filter(function(item) {
        return item.statusId === 2; // Chỉ lấy sản phẩm đã thanh toán
    });
    
    // Nếu có chọn năm, lọc tiếp theo năm
    if ($scope.selectedYear) {
        $scope.filteredOrderDetails = $scope.filteredOrderDetails.filter(function(item) {
            return item.year == $scope.selectedYear; // Sử dụng == để so sánh kiểu dữ liệu
        });
    }

    console.log('Filtered Order Details:', $scope.filteredOrderDetails);
    $scope.calculateYearlyStats();
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
                categories: $scope.yearlyStats.map(stat => `${stat.year} - ${stat.productName}`), // Hiển thị tên sản phẩm
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
    $scope.getDiscounts(); // Lấy dữ liệu sản phẩm
});