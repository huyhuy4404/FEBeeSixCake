var app = angular.module('myApp', []);
app.controller('discountsController', function($scope, $http) {
    $scope.orderdetai = [];
    $scope.filteredOrderDetails = []; // Biến để lưu dữ liệu đã lọc
    $scope.startDate = null; // Ngày bắt đầu
    $scope.endDate = null; // Ngày kết thúc

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
            $scope.renderChart(); // Vẽ biểu đồ ngay khi dữ liệu được lấy
        })
        .catch(function(error) {
            console.error('Error fetching product details:', error);
        });
    };

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

        // Cập nhật biểu đồ sau khi lọc dữ liệu
        $scope.renderChart();
    };

    $scope.renderChart = function() {
        // Nếu không có dữ liệu, không vẽ biểu đồ
        if ($scope.filteredOrderDetails.length === 0) {
            document.getElementById("pie-chart").innerHTML = ""; // Xóa biểu đồ nếu không có dữ liệu
            return;
        }

        var options = {
            series: $scope.filteredOrderDetails.map(item => item.quantity), // Số lượng sản phẩm
            chart: {
                width: 380,
                type: 'pie',
            },
            labels: $scope.filteredOrderDetails.map(item => item.name), // Tên sản phẩm
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

    $scope.getDiscounts(); // Gọi hàm để lấy dữ liệu
});