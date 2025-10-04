import { DataTypes } from 'sequelize';

/**
 * ✅ Conversation Note Model - Sequelize
 * يدير الملاحظات الداخلية على المحادثات
 */
export const createConversationNoteModel = (sequelize) => {
  const ConversationNote = sequelize.define(
    'ConversationNote',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      conversationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'WhatsApp conversation ID',
        field: 'conversation_id',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'User who created the note',
        field: 'user_id',
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Note content',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
    },
    {
      tableName: 'conversation_notes',
      timestamps: false, // نستخدم created_at فقط
      indexes: [
        {
          name: 'idx_notes_conversation',
          fields: ['conversation_id'],
        },
        {
          name: 'idx_notes_user',
          fields: ['user_id'],
        },
        {
          name: 'idx_notes_created',
          fields: ['created_at'],
        },
      ],
      comment: 'Internal notes on WhatsApp conversations',
    }
  );

  return ConversationNote;
};

export default createConversationNoteModel;
