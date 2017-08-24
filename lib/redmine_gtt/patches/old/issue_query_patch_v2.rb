module RedmineGtt
  module Patches

    module IssueQueryPatch
      def self.included(base)
        base.extend(ClassMethods)
        base.send(:include, InstanceMethods)
        base.class_eval do
          unloadable
          # alias_method_chain :available_columns, :geojson
        end
      end

      module InstanceMethods
        # def available_columns_with_geojson
        #   @available_columns = available_columns_without_geojson
        #   @available_columns << QueryColumn.new(:geojson,
        #                           :caption => "Geojson",
        #                           :sortable => "#{Issue.table_name}.geom")
        # end
      end

      module ClassMethods
        unless Query.respond_to?(:available_columns=)
          # Setter for +available_columns+ that isn't provided by the core.
          def available_columns=(v)
            self.available_columns = (v)
          end
        end

        unless Query.respond_to?(:add_available_column)
          # Method to add a column to the +available_columns+ that isn't provided by the core.
          def add_available_column(column)
            self.available_columns << (column)
          end
        end
      end

    end
  end
end
