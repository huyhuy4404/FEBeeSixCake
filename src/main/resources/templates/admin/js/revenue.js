var app = angular.module('myApp', []);

app.controller('discountsController', function($scope, $http) {
    $scope.orderdetai = [];
    $scope.filteredOrderDetails = []; // Biến để lưu dữ liệu đã lọc
    $scope.groupedOrderDetails = []; // Biến để lưu dữ liệu đã nhóm
    $scope.startDate = null; // Ngày bắt đầu
    $scope.endDate = null; // Ngày kết thúc

    // Hàm lấy dữ liệu giảm giá
    $scope.getDiscounts = function() {
        $http.get('http://localhost:8080/beesixcake/api/orderdetail')
        .then(function(response) {
            console.log(response.data); // Kiểm tra dữ liệu nhận được
            $scope.orderdetai = response.data.map(function(item) {
                var orderDate = new Date(item.order.orderdate);
                return {
                    date: orderDate.toISOString().split('T')[0], // Lưu ngày theo định dạng YYYY-MM-DD
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
            $scope.groupData(); // Nhóm dữ liệu ngay khi dữ liệu được lấy
            $scope.renderChart(); // Vẽ biểu đồ ngay khi dữ liệu được lấy
        })
        .catch(function(error) {
            console.error('Error fetching product details:', error);
        });
    };

    // Hàm nhóm dữ liệu theo ngày và loại sản phẩm
    $scope.groupData = function() {
        $scope.groupedOrderDetails = [];

        const statsMap = {}; // Đối tượng chứa thông tin thống kê

        $scope.filteredOrderDetails.forEach(function(item) {
            var date = item.date; // Lấy ngày
            var categoryName = item.categoryName; // Lấy tên loại sản phẩm

            // Tạo key cho mỗi loại sản phẩm trong ngày
            var key = `${date}-${categoryName}`;

            if (!statsMap[key]) {
                statsMap[key] = {
                    date: date,
                    categoryName: categoryName,
                    totalQuantity: 0,
                    totalRevenue: 0
                };
            }

            // Cộng dồn số lượng và doanh thu cho loại sản phẩm
            statsMap[key].totalQuantity += item.quantity; // Cộng dồn số lượng
            statsMap[key].totalRevenue += item.unitprice * item.quantity; // Tổng doanh thu cho từng sản phẩm
        });

        // Chuyển đổi đối tượng thành mảng để lưu vào groupedOrderDetails
        $scope.groupedOrderDetails = Object.values(statsMap);

        console.log($scope.groupedOrderDetails); // Kiểm tra thống kê sau khi tính toán
    };

    // Hàm xuất dữ liệu ra Excel
    $scope.exportToExcel = function() {
        const worksheet = XLSX.utils.json_to_sheet($scope.groupedOrderDetails.map(item => ({
            'Ngày tạo': item.date,
            'Loại Sản Phẩm': item.categoryName,
            'Số lượng': item.totalQuantity,
            'Giá': item.totalRevenue
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Order Details");

        // Xuất file
        XLSX.writeFile(workbook, 'order_details.xlsx');
    };

    // Hàm lọc dữ liệu theo ngày
    $scope.filterData = function() {
        $scope.filteredOrderDetails = $scope.orderdetai.filter(function(item) {
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

        // Nhóm dữ liệu sau khi lọc
        $scope.groupData();
        
        // Cập nhật biểu đồ sau khi lọc dữ liệu
        $scope.renderChart();
    };

    // Hàm vẽ biểu đồ
    $scope.renderChart = function() {
        // Nếu không có dữ liệu, không vẽ biểu đồ
        if ($scope.groupedOrderDetails.length === 0) {
            document.getElementById("pie-chart").innerHTML = ""; // Xóa biểu đồ nếu không có dữ liệu
            return;
        }

        var options = {
            series: $scope.groupedOrderDetails.map(item => item.totalQuantity), // Số lượng sản phẩm
            chart: {
                width: 380,
                type: 'pie',
            },
            labels: $scope.groupedOrderDetails.map(item => item.categoryName), // Tên sản phẩm
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }]
        };

        var chart = new ApexCharts(document.querySelector("#pie-chart"), options);
        chart.render();
    };

    // Hàm định dạng tiền tệ
    $scope.formatCurrency = function(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Gọi hàm để lấy dữ liệu
    $scope.getDiscounts();
});