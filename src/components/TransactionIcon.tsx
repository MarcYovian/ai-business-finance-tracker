import { Transaction } from '@/types/finance';
import { ArrowUp, ArrowDown, ArrowRightLeft, AlertCircle } from 'lucide-react';

interface TransactionIconProps {
  type: Transaction['type'];
}

export const TransactionIcon = ({ type }: TransactionIconProps) => {
  switch (type) {
    case 'income':
      return <ArrowUp className="h-5 w-5" />;
    case 'expense':
      return <ArrowDown className="h-5 w-5" />;
    case 'transfer':
      return <ArrowRightLeft className="h-5 w-5" />;
    default:
      return <AlertCircle className="h-5 w-5" />;
  }
};