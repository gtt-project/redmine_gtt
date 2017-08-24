require 'pp'

module RedmineGtt
  module Patches
    module IssueQueryPatch
      def self.included(base)
        base.extend(ClassMethods)
        base.send(:include, InstanceMethods)
        base.class_eval do
          unloadable
          IssueQuery.add_available_column(QueryColumn.new(:geometry,
                                  :sortable => "#{Issue.table_name}.geometry"))
          IssueQuery.add_available_column(QueryColumn.new(:geom,
                                  :sortable => "#{Issue.table_name}.geom"))
          alias_method_chain :initialize_available_filters, :nearby
          alias_method_chain :sql_for_field, :nearby
          #alias_method_chain :available_filters, :geometry
        end
      end

      module ClassMethods
      end

      module InstanceMethods
        def initialize_available_filters_with_nearby
          initialize_available_filters_without_nearby
          self.operators["n"] = :label_nearby
          self.operators_by_filter_type[:nearby] = ["n"]
          add_available_filter "geom", :type=>:nearby
          @geom_point = nil;
        end

        def sql_for_field_with_nearby(field, operator, value, db_table, db_field, is_custom_filter=false)
          if (operator == "n")
            lat = value[0].split(',')[0]
            lng = value[0].split(',')[1]
            @geom_point = [lat,lng]
            "ST_GeomFromText('POINT(#{lng} #{lat})') = ST_GeomFromText('POINT(#{lng} #{lat})')"
            # it should have been using st_within, but there is one parameter yet. @todo fix this
          else
            sql_for_field_without_nearby(field, operator, value, db_table, db_field, is_custom_filter)
          end
        end
      end

      # Additional joins required for the given sort options
      def joins_for_order_statement_with_nearby(order_options)
        pp "!!!!!!!!!OOORRRRRRDDDDDDDEEEEEEEEERRRRRRRRRRRROPTIONS!!!!!!!!!!"
        pp order_options
        pp @geom_point
        lat = @geom_point[0]
        lng = @geom_point[1]
        if (order_options.include?("geom"))
          "ST_Distance(issues.geom, ST_GeomFromText('POINT(#{lng} #{lat})')) ASC"
        else
          joins_for_order_statement_without_nearby(order_options)
        end

        #joins = []
#
#        if order_options
#          if order_options.include?('authors')
#            joins << "LEFT OUTER JOIN #{User.table_name} authors ON authors.id = #{queried_table_name}.author_id"
#          end
#          order_options.scan(/cf_\d+/).uniq.each do |name|
#            column = available_columns.detect {|c| c.name.to_s == name}
#            join = column && column.custom_field.join_for_order_statement
#            if join
#              joins << join
#            end
#          end
#        end
#        joins.any? ? joins.join(' ') : nil
      end
    end
  end
end
